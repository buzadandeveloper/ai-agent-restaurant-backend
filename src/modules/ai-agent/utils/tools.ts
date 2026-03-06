export const tools = [
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
          description: 'ID-ul mesei (NU numărul mesei, verifică din lista de mese)',
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
  {
    type: 'function',
    name: 'pay_bill',
    description:
      'Folosește acest tool când clientul spune că vrea să plătească, să achite, să închidă nota, să ceară nota sau să finalizeze comanda. Tool-ul procesează plata finală pentru masa curentă.',
    parameters: {
      type: 'object',
      properties: {
        restaurantId: {
          type: 'number',
          description: 'ID-ul restaurantului',
        },
        tableId: {
          type: 'number',
          description: 'ID-ul intern al mesei, nu numărul afișat al mesei',
        },
      },
      required: ['restaurantId', 'tableId'],
    },
  },
];
