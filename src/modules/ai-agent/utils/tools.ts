export const tools = [
  [
    {
      type: 'function',
      name: 'create_order',
      description: 'Creează o comandă nouă pentru masa clientului',
      parameters: {
        type: 'object',
        properties: {
          restaurantId: {
            type: 'number',
            description: 'ID-ul restaurantului (identificat din conversație)',
          },
          tableId: {
            type: 'number',
            description: 'ID-ul mesei (NU numărul mesei, verifică din lista de mese)',
          },
          items: {
            type: 'array',
            description: 'Lista de produse comandate',
            items: {
              type: 'object',
              properties: {
                menuItemId: {
                  type: 'number',
                  description: 'ID-ul produsului din meniu',
                },
                quantity: {
                  type: 'number',
                  description: 'Cantitatea dorită',
                },
              },
              required: ['menuItemId', 'quantity'],
            },
          },
        },
        required: ['restaurantId', 'tableId', 'items'],
      },
    },
    {
      type: 'function',
      name: 'add_items_to_order',
      description: 'Adaugă produse la o comandă existentă',
      parameters: {
        type: 'object',
        properties: {
          restaurantId: {
            type: 'number',
            description: 'ID-ul restaurantului',
          },
          tableId: {
            type: 'number',
            description: 'ID-ul mesei',
          },
          orderId: {
            type: 'number',
            description: 'ID-ul comenzii existente',
          },
          items: {
            type: 'array',
            description: 'Lista de produse de adăugat',
            items: {
              type: 'object',
              properties: {
                menuItemId: {
                  type: 'number',
                  description: 'ID-ul produsului din meniu',
                },
                quantity: {
                  type: 'number',
                  description: 'Cantitatea dorită',
                },
              },
              required: ['menuItemId', 'quantity'],
            },
          },
        },
        required: ['restaurantId', 'tableId', 'orderId', 'items'],
      },
    },
  ],
];
