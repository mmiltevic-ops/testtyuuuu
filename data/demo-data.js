// Демо-данные: используются, если MySQL недоступна (DEMO_FALLBACK=true)
module.exports = {
  services: [
    {
      id: 1,
      title: 'Техническое обслуживание',
      description: 'Замена масла и фильтров, диагностика по регламенту производителя. Работаем с оригинальными расходниками.',
      price_from: 2500,
      duration_min: 90,
      icon: 'oil',
      sort_order: 1
    },
    {
      id: 2,
      title: 'Компьютерная диагностика',
      description: 'Считывание и расшифровка ошибок блоков управления, проверка датчиков и электрики.',
      price_from: 1200,
      duration_min: 45,
      icon: 'diag',
      sort_order: 2
    },
    {
      id: 3,
      title: 'Ремонт тормозной системы',
      description: 'Замена колодок и дисков, тормозных шлангов, прокачка системы, ремонт суппортов.',
      price_from: 1800,
      duration_min: 120,
      icon: 'brake',
      sort_order: 3
    },
    {
      id: 4,
      title: 'Подвеска и рулевое',
      description: 'Замена амортизаторов, рычагов, шаровых опор, ступичных подшипников. Развал-схождение.',
      price_from: 2200,
      duration_min: 150,
      icon: 'suspension',
      sort_order: 4
    },
    {
      id: 5,
      title: 'Ремонт двигателя',
      description: 'Замена ремня или цепи ГРМ, прокладок и сальников, капитальный ремонт агрегатов.',
      price_from: 6000,
      duration_min: 240,
      icon: 'engine',
      sort_order: 5
    },
    {
      id: 6,
      title: 'Шиномонтаж и хранение шин',
      description: 'Балансировка, правка дисков, сезонная замена колёс и хранение комплекта.',
      price_from: 900,
      duration_min: 60,
      icon: 'tire',
      sort_order: 6
    },
    {
      id: 7,
      title: 'Кузовной ремонт и покраска',
      description: 'Удаление вмятин, рихтовка, локальная покраска, полировка и защитные покрытия.',
      price_from: 4500,
      duration_min: 300,
      icon: 'body',
      sort_order: 7
    },
    {
      id: 8,
      title: 'Кондиционер и климат',
      description: 'Заправка фреоном, поиск утечек, антибактериальная обработка, ремонт компрессора.',
      price_from: 1600,
      duration_min: 75,
      icon: 'ac',
      sort_order: 8
    }
  ],

  masters: [
    { id: 1, name: 'Алексей Ковалёв', position: 'Главный механик', experience_years: 14, sort_order: 1 },
    { id: 2, name: 'Дмитрий Соколов', position: 'Диагност', experience_years: 9, sort_order: 2 },
    { id: 3, name: 'Игорь Лебедев', position: 'Мастер по подвеске', experience_years: 11, sort_order: 3 },
    { id: 4, name: 'Марина Ершова', position: 'Мастер-приёмщик', experience_years: 7, sort_order: 4 }
  ],

  reviews: [
    { id: 1, author: 'Сергей', car: 'Toyota Camry 70', rating: 5, text: 'Поменяли ГРМ и все расходники за день. Дали гарантию, показали старые детали.' },
    { id: 2, author: 'Ольга', car: 'Kia Rio', rating: 5, text: 'Нашли стук в подвеске, который в двух других сервисах определить не смогли. Цены приятные.' },
    { id: 3, author: 'Артём', car: 'BMW 3 F30', rating: 5, text: 'Диагностика по-взрослому: с распечаткой ошибок и планом ремонта. Ничего лишнего не навязывали.' },
    { id: 4, author: 'Николай', car: 'VW Polo', rating: 4, text: 'Починили в срок, но пришлось немного подождать в очереди. По качеству вопросов нет.' },
    { id: 5, author: 'Екатерина', car: 'Hyundai Solaris', rating: 5, text: 'Отдельное спасибо мастеру-приёмщику: всё объяснила простыми словами и прислала фотоотчёт.' }
  ]
};
