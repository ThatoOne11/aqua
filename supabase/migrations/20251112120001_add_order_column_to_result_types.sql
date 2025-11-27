ALTER TABLE public.result_types
ADD COLUMN "order" INT NOT NULL DEFAULT 1000;

UPDATE public.result_types SET "order" = 5 WHERE id = 'fcbb4a30-ecfd-441a-9ab3-5162ccc6032b';
UPDATE public.result_types SET "order" = 4 WHERE id = '2c270538-f068-4e5f-bdfb-f8eeec447fdf';
UPDATE public.result_types SET "order" = 6 WHERE id = '5be7576c-bedb-4072-ba7d-7e29e38a3321';
UPDATE public.result_types SET "order" = 7 WHERE id = 'a24da767-70d1-4405-af9d-fb0b4fe19599';
UPDATE public.result_types SET "order" = 1 WHERE id = 'bf140fcd-f251-4da9-af75-a47d652b8443';
UPDATE public.result_types SET "order" = 2 WHERE id = 'bdd25926-4374-4f4d-b157-c9d72f23ac54';
UPDATE public.result_types SET "order" = 3 WHERE id = '3f089773-44e8-48ac-a693-23457c8a1917';
UPDATE public.result_types SET "order" = 9 WHERE id = 'ccf5e30f-0253-42ef-a2bd-bbb79966dcb8';
UPDATE public.result_types SET "order" = 8 WHERE id = 'c51cf851-09fb-4219-959c-d50db504749c';
UPDATE public.result_types SET "order" = 10 WHERE id = '9db36ca7-c5f5-4728-bafb-141d6ab71460';
UPDATE public.result_types SET "order" = 11 WHERE id = 'f7f8d7a6-d571-47ab-94c6-f97aa094d47e';
