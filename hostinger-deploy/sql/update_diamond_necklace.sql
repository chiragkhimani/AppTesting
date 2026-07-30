-- Replace Everyday Canvas Tote (id 7) with Diamond Necklace
UPDATE products
SET
    name = 'Diamond Necklace',
    description = 'Elegant sterling-silver necklace with a brilliant-cut simulated diamond pendant. Adjustable chain and secure clasp for everyday or special-occasion wear.',
    price = 129.99,
    image_url = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
    category = 'Jewelry',
    stock = 25
WHERE id = 7;
