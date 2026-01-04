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

    return { message: 'Restaurant created', restaurantId: restaurant.id };
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

    return { message: 'Restaurant updated successfully', restaurantId: updatedRestaurant.id };
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
}
