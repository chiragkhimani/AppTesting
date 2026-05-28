-- QA Demo Store – seed data
-- Run AFTER schema.sql

-- Demo users (saucedemo-style, password = secret_sauce for all)
INSERT INTO users (id, username, password, first_name, last_name, locked) VALUES
    (1, 'standard_user',   'secret_sauce', 'Standard',   'User', 0),
    (2, 'locked_out_user', 'secret_sauce', 'Locked Out', 'User', 1),
    (3, 'problem_user',    'secret_sauce', 'Problem',    'User', 0);

-- Demo products
INSERT INTO products (id, name, description, price, image_url, category, stock) VALUES
    (1, 'Sauce Labs Backpack',
        'Carry.allTheThings() with this sleek, streamlined backpack. Padded laptop sleeve, water bottle pocket, and stylish design.',
        29.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', 'Bags', 25),
    (2, 'Sauce Labs Bike Light',
        'A red light isn''t the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes.',
        9.99, 'https://images.unsplash.com/photo-1544191696-15693072e0b5?w=600&q=80', 'Accessories', 100),
    (3, 'Sauce Labs Bolt T-Shirt',
        'Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray.',
        15.99, 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&q=80', 'Apparel', 50),
    (4, 'Sauce Labs Fleece Jacket',
        'It''s not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.',
        49.99, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', 'Apparel', 30),
    (5, 'Sauce Labs Onesie',
        'Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeves.',
        7.99, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80', 'Apparel', 80),
    (6, 'Test.allTheThings() T-Shirt (Red)',
        'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.',
        15.99, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80', 'Apparel', 40);
