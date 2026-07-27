-- Fix broken Ceramic Pour-Over Mug image (product id 9)
UPDATE products
SET image_url = 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&q=80'
WHERE id = 9;
