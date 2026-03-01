export type KnowledgeBaseData = {
  firstName: string;
  lastName: string;
  restaurants: Array<{
    id: number;
    name: string;
    description: string;
    address: string;
    phone: string;
    tables: Array<{
      id: number;
      tableNumber: number;
    }>;
    categories: Array<{
      name: string;
      items: Array<{
        id: number;
        name: string;
        description: string;
        price: number;
        currency: string;
        tags: string[];
        allergens: string[];
      }>;
    }>;
  }>;
};
