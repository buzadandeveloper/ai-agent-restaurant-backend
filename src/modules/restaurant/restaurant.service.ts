import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RestaurantFormDto, CreateRestaurantResponseDto, RestaurantDto } from './dto';
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

    const restaurant = await this.prisma.restaurant.create({
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

    // Process optional CSV menu file (uploaded as 'menuCsv' field in multipart/form-data)
    if (file && file.buffer) {
      const rows: CsvRow[] = [];
      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(file.buffer);
        stream
          .pipe(csv())
          .on('data', (data: CsvRow) => rows.push(data))
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      const categoryCache = new Map();
      for (const row of rows) {
        const categoryName = row.category.trim();
        let category = categoryCache.get(categoryName);

        if (!category) {
          category = await this.prisma.menuCategory.findFirst({
            where: { name: categoryName, restaurantId: restaurant.id },
          });

          if (!category) {
            category = await this.prisma.menuCategory.create({
              data: { name: categoryName, restaurantId: restaurant.id },
            });
          }

          categoryCache.set(categoryName, category);
        }

        await this.prisma.menuItem.create({
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

    const updatedRestaurant = await this.prisma.restaurant.update({
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

    if (file && file.buffer) {
      // Delete existing menu items and categories for this restaurant to avoid duplicates
      await this.prisma.menuItem.deleteMany({
        where: {
          category: {
            restaurantId: updatedRestaurant.id,
          },
        },
      });

      await this.prisma.menuCategory.deleteMany({
        where: {
          restaurantId: updatedRestaurant.id,
        },
      });

      const rows: CsvRow[] = [];
      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(file.buffer);
        stream
          .pipe(csv())
          .on('data', (data: CsvRow) => rows.push(data))
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      const categoryCache = new Map();
      for (const row of rows) {
        const categoryName = row.category.trim();
        let category = categoryCache.get(categoryName);

        if (!category) {
          category = await this.prisma.menuCategory.findFirst({
            where: { name: categoryName, restaurantId: updatedRestaurant.id },
          });

          if (!category) {
            category = await this.prisma.menuCategory.create({
              data: { name: categoryName, restaurantId: updatedRestaurant.id },
            });
          }

          categoryCache.set(categoryName, category);
        }

        await this.prisma.menuItem.create({
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
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    // Return flat structure suitable for table display and filtering
    return {
      restaurantId,
      restaurantName: restaurant.name,
      items: menuItems.map(item => ({
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
        categoryDescription: item.category.description,
      }))
    };
  }

  async deleteRestaurantMenu(restaurantId: number, ownerId: number): Promise<{ message: string; restaurantId: number }> {
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

    // First delete existing menu items and categories to replace them
    await this.prisma.menuItem.deleteMany({
      where: {
        category: {
          restaurantId: restaurantId,
        },
      },
    });

    await this.prisma.menuCategory.deleteMany({
      where: {
        restaurantId: restaurantId,
      },
    });

    // Process the new CSV menu file
    if (file && file.buffer) {
      const rows: CsvRow[] = [];
      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(file.buffer);
        stream
          .pipe(csv())
          .on('data', (data: CsvRow) => rows.push(data))
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      const categoryCache = new Map();
      for (const row of rows) {
        const categoryName = row.category.trim();
        let category = categoryCache.get(categoryName);

        if (!category) {
          category = await this.prisma.menuCategory.findFirst({
            where: { name: categoryName, restaurantId: restaurantId },
          });

          if (!category) {
            category = await this.prisma.menuCategory.create({
              data: { name: categoryName, restaurantId: restaurantId },
            });
          }

          categoryCache.set(categoryName, category);
        }

        await this.prisma.menuItem.create({
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

    return { message: 'Restaurant menu uploaded successfully', restaurantId };
  }
}
