import { KnowledgeBaseData, UserWithRestaurantsData } from '../types/knowledge-base-data.types';


export const getKnowledgeBase = (UserWithRestaurants: UserWithRestaurantsData): KnowledgeBaseData => {
  return {
    firstName: UserWithRestaurants.firstName,
    lastName: UserWithRestaurants.lastName,
    restaurants: UserWithRestaurants.restaurants.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone: restaurant.phone,
      tables: restaurant.tables.map((table) => ({
        id: table.id,
        tableNumber: table.tableNumber,
      })),
      categories: restaurant.categories.map((category) => ({
        name: category.name,
        items: category.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? '',
          price: Number(item.price),
          currency: item.currency,
          tags: item.tags,
          allergens: item.allergens,
        })),
      })),
    })),
  };
};
