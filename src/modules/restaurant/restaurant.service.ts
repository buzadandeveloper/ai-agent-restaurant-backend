import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRestaurantResponseDto, RestaurantDto, RestaurantFormDto } from './dto';
import { Readable } from 'stream';
import csv from 'csv-parser';
import * as crypto from 'crypto';

interface CsvRow {
  name: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  tags?: string;
  allergens?: string;
  isAvailable?: string;
}

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  private generateConfigKey(): string {
    // Generate a unique config key with prefix 'rest_' followed by a random string
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `rest_${randomBytes.substring(0, 16)}`;
  }

  private validateCsvData(csvRows: CsvRow[]): void {
    if (csvRows.length === 0) {
      throw new BadRequestException('CSV file is empty or contains no valid data');
    }

    const errors: string[] = [];

    csvRows.forEach((row, index) => {
      const rowNumber = index + 2;

      // Validate required fields
      if (!row.name || row.name.trim() === '') {
        errors.push(`Row ${rowNumber}: 'name' is required`);
      }

      if (!row.category || row.category.trim() === '') {
        errors.push(`Row ${rowNumber}: 'category' is required`);
      }

      // Validate price
      if (!row.price || row.price.trim() === '') {
        errors.push(`Row ${rowNumber}: 'price' is required`);
      } else {
        const price = parseFloat(row.price);
        if (isNaN(price)) {
          errors.push(`Row ${rowNumber}: 'price' must be a valid number (found: "${row.price}")`);
        } else if (price < 0) {
          errors.push(`Row ${rowNumber}: 'price' must be a positive number`);
        }
      }

      // Validate currency (optional, but if present should not be empty)
      if (row.currency && row.currency.trim() === '') {
        errors.push(`Row ${rowNumber}: 'currency' cannot be empty if provided`);
      }

      // Validate description (optional, but warn if too long)
      if (row.description && row.description.length > 500) {
        errors.push(`Row ${rowNumber}: 'description' is too long (max 500 characters)`);
      }
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'CSV validation failed',
        errors: errors,
      });
    }
  }

  async getUserRestaurants(ownerId: number): Promise<RestaurantDto[]> {
    return this.prisma.restaurant.findMany({
      where: {
        ownerId: ownerId,
      },
    });
  }

  async getRestaurantById(restaurantId: number, ownerId: number): Promise<RestaurantDto> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to view this restaurant');
    }

    return restaurant;
  }

  async createRestaurant(
    restaurantData: RestaurantFormDto,
    ownerId: number,
    file?: Express.Multer.File,
  ): Promise<CreateRestaurantResponseDto> {
    const configKey = this.generateConfigKey();

    // Parse CSV first if provided to validate it BEFORE creating restaurant
    let csvRows: CsvRow[] = [];
    if (file && file.buffer) {
      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(file.buffer);
        stream
          .pipe(csv())
          .on('data', (data: CsvRow) => csvRows.push(data))
          .on('end', () => resolve())
          .on('error', (err) => reject(new BadRequestException(`CSV parsing failed: ${err.message}`)));
      });

      // Validate CSV data before processing
      this.validateCsvData(csvRows);
    }

    // Use transaction to ensure atomicity - if anything fails, nothing is saved
    const restaurant = await this.prisma.$transaction(async (tx) => {
      // Create restaurant
      const newRestaurant = await tx.restaurant.create({
        data: {
          name: restaurantData.name,
          description: restaurantData.description,
          founder: restaurantData.founder,
          administrator: restaurantData.administrator,
          numberOfTables: restaurantData.numberOfTables,
          phone: restaurantData.phone,
          address: restaurantData.address,
          configKey: configKey,
          ownerId: ownerId,
        },
      });

      // Process CSV menu if provided (inside transaction)
      if (csvRows.length > 0) {
        const categoryCache = new Map();
        for (const row of csvRows) {
          const categoryName = row.category.trim();
          const cacheKey = `${newRestaurant.id}_${categoryName}`;
          let category = categoryCache.get(cacheKey);

          if (!category) {
            category = await tx.menuCategory.findFirst({
              where: { name: categoryName, restaurantId: newRestaurant.id },
            });

            if (!category) {
              category = await tx.menuCategory.create({
                data: { name: categoryName, restaurantId: newRestaurant.id },
              });
            }

            categoryCache.set(cacheKey, category);
          }

          await tx.menuItem.create({
            data: {
              name: row.name,
              description: row.description,
              price: parseFloat(row.price),
              currency: row.currency || 'MDL',
              tags: row.tags ? row.tags.split(',') : [],
              allergens: row.allergens ? row.allergens.split(',') : [],
              isAvailable: row.isAvailable
                ? ['true', '1', 'yes', 'available'].includes(row.isAvailable.toLowerCase().trim())
                : true,
              categoryId: category.id,
            },
          });
        }
      }

      return newRestaurant;
    });

    return { message: 'Restaurant created', restaurant };
  }

  async updateRestaurant(
    restaurantId: number,
    restaurantData: RestaurantFormDto,
    ownerId: number,
    file?: Express.Multer.File,
  ): Promise<CreateRestaurantResponseDto> {
    const existingRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!existingRestaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (existingRestaurant.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to update this restaurant');
    }

    // Parse CSV first if provided to validate it BEFORE updating restaurant
    let csvRows: CsvRow[] = [];
    if (file && file.buffer) {
      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(file.buffer);
        stream
          .pipe(csv())
          .on('data', (data: CsvRow) => csvRows.push(data))
          .on('end', () => resolve())
          .on('error', (err) => reject(new BadRequestException(`CSV parsing failed: ${err.message}`)));
      });

      // Validate CSV data before processing
      this.validateCsvData(csvRows);
    }

    // Use transaction to ensure atomicity
    const updatedRestaurant = await this.prisma.$transaction(async (tx) => {
      // Update restaurant
      const updated = await tx.restaurant.update({
        where: { id: restaurantId },
        data: {
          name: restaurantData.name,
          description: restaurantData.description,
          founder: restaurantData.founder,
          administrator: restaurantData.administrator,
          numberOfTables: restaurantData.numberOfTables,
          phone: restaurantData.phone,
          address: restaurantData.address,
        },
      });

      // If CSV provided, replace menu
      if (csvRows.length > 0) {
        // Delete existing menu items and categories for this restaurant to avoid duplicates
        await tx.menuItem.deleteMany({
          where: {
            category: {
              restaurantId: updated.id,
            },
          },
        });

        await tx.menuCategory.deleteMany({
          where: {
            restaurantId: updated.id,
          },
        });

        const categoryCache = new Map();
        for (const row of csvRows) {
          const categoryName = row.category.trim();
          const cacheKey = `${updated.id}_${categoryName}`;
          let category = categoryCache.get(cacheKey);

          if (!category) {
            category = await tx.menuCategory.findFirst({
              where: { name: categoryName, restaurantId: updated.id },
            });

            if (!category) {
              category = await tx.menuCategory.create({
                data: { name: categoryName, restaurantId: updated.id },
              });
            }

            categoryCache.set(cacheKey, category);
          }

          await tx.menuItem.create({
            data: {
              name: row.name,
              description: row.description,
              price: parseFloat(row.price),
              currency: row.currency || 'MDL',
              tags: row.tags ? row.tags.split(',') : [],
              allergens: row.allergens ? row.allergens.split(',') : [],
              isAvailable: row.isAvailable
                ? ['true', '1', 'yes', 'available'].includes(row.isAvailable.toLowerCase().trim())
                : true,
              categoryId: category.id,
            },
          });
        }
      }

      return updated;
    });

    return { message: 'Restaurant updated successfully', restaurant: updatedRestaurant };
  }

  async deleteRestaurant(restaurantId: number, ownerId: number): Promise<{ message: string; restaurantId: number }> {
    const existingRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!existingRestaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (existingRestaurant.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to delete this restaurant');
    }

    await this.prisma.restaurant.delete({
      where: { id: restaurantId },
    });

    return { message: 'Restaurant deleted successfully', restaurantId };
  }

  async getRestaurantMenu(restaurantId: number, ownerId: number) {
    // Verify restaurant exists and belongs to owner
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to view this restaurant menu');
    }

    // Get all menu items with their categories for this restaurant - flat structure for table
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        category: {
          restaurantId: restaurantId,
        },
      },
      include: {
        category: true,
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });

    // Return flat structure suitable for table display and filtering
    return menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      currency: item.currency,
      isAvailable: item.isAvailable,
      tags: item.tags,
      allergens: item.allergens,
      categoryId: item.category.id,
      categoryName: item.category.name,
    }));
  }

  async deleteRestaurantMenu(
    restaurantId: number,
    ownerId: number,
  ): Promise<{ message: string; restaurantId: number }> {
    // Verify restaurant exists and belongs to owner
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to delete this restaurant menu');
    }

    // Delete all menu items for this restaurant
    await this.prisma.menuItem.deleteMany({
      where: {
        category: {
          restaurantId: restaurantId,
        },
      },
    });

    // Delete all menu categories for this restaurant
    await this.prisma.menuCategory.deleteMany({
      where: {
        restaurantId: restaurantId,
      },
    });

    return { message: 'Restaurant menu deleted successfully', restaurantId };
  }

  async uploadNewRestaurantMenu(
    restaurantId: number,
    ownerId: number,
    file: Express.Multer.File,
  ): Promise<{ message: string; restaurantId: number }> {
    // Verify restaurant exists and belongs to owner
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to upload menu for this restaurant');
    }

    // Parse CSV first to validate it BEFORE deleting existing menu
    const csvRows: CsvRow[] = [];
    if (file && file.buffer) {
      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(file.buffer);
        stream
          .pipe(csv())
          .on('data', (data: CsvRow) => csvRows.push(data))
          .on('end', () => resolve())
          .on('error', (err) => reject(new BadRequestException(`CSV parsing failed: ${err.message}`)));
      });

      // Validate CSV data before processing
      this.validateCsvData(csvRows);
    }

    // Use transaction to ensure atomicity - if CSV processing fails, old menu stays intact
    await this.prisma.$transaction(async (tx) => {
      // First delete existing menu items and categories to replace them
      await tx.menuItem.deleteMany({
        where: {
          category: {
            restaurantId: restaurantId,
          },
        },
      });

      await tx.menuCategory.deleteMany({
        where: {
          restaurantId: restaurantId,
        },
      });

      // Process the new CSV menu file
      const categoryCache = new Map();
      for (const row of csvRows) {
        const categoryName = row.category.trim();
        const cacheKey = `${restaurantId}_${categoryName}`;
        let category = categoryCache.get(cacheKey);

        if (!category) {
          category = await tx.menuCategory.findFirst({
            where: { name: categoryName, restaurantId: restaurantId },
          });

          if (!category) {
            category = await tx.menuCategory.create({
              data: { name: categoryName, restaurantId: restaurantId },
            });
          }

          categoryCache.set(cacheKey, category);
        }

        await tx.menuItem.create({
          data: {
            name: row.name,
            description: row.description,
            price: parseFloat(row.price),
            currency: row.currency || 'MDL',
            tags: row.tags ? row.tags.split(',') : [],
            allergens: row.allergens ? row.allergens.split(',') : [],
            isAvailable: row.isAvailable
              ? ['true', '1', 'yes', 'available'].includes(row.isAvailable.toLowerCase().trim())
              : true,
            categoryId: category.id,
          },
        });
      }
    });

    return { message: 'Restaurant menu uploaded successfully', restaurantId };
  }
}
