import { KnowledgeBaseData } from '../types/knowledge-base-data.types';

export const getKnowledgeBase = (user: KnowledgeBaseData) => {
  return {
    owner: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
    restaurants: user.restaurants.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone: restaurant.phone,
      tables: restaurant.tables.map((table) => ({
        id: table.id,
        tableNumber: table.tableNumber,
      })),
      menu: restaurant.categories.map((category) => ({
        category: category.name,
        items: category.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          currency: item.currency,
          tags: item.tags,
          allergens: item.allergens,
        })),
      })),
    })),
  };
};
