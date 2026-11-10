-- ==============================================================================
-- Supabase V1 Content Cleanup Script
-- Project target: txrnbazpdyoaazszkwwq ONLY
-- Removes seeded v1 content, drops temporary v1 tables (tools, blogs),
-- and restores original 8 projects to is_published = true.
-- Wrapped in an atomic transaction.
-- ==============================================================================

BEGIN;

-- 1. Remove seeded projects (exact 17 IDs from seed/04_projects.sql)
DELETE FROM public.projects
WHERE id IN (
  '9127aa98-4afc-47b0-9aeb-0649ee4b5358',
  'a3c91a11-87c8-499a-88a9-2e1b850cd62f',
  '398d15ea-b052-4305-9420-3d9c621d2cb5',
  '12f4c21d-f411-4e34-877e-5a35b75466fd',
  '1f501650-e4d9-4663-b616-8348012afeb8',
  'c1f2a14e-5cd6-40d2-914d-d0a72e4efd5d',
  'a1f79ce5-4068-489a-8880-0cee7a5e4598',
  'ef23661b-c967-493b-ac58-0b4a592f2180',
  '5f782792-b2d3-4c32-8658-511a5505d762',
  'ae733951-4f5e-44e6-86ee-0e91bd211f56',
  '5b760129-f286-4b65-875b-b34dfd84e9b7',
  '26fef684-bcdc-4d46-808e-a4aa92f28f6f',
  '8c528de1-e339-4ba1-97cd-311a46168a24',
  '97fcd35a-a08b-4f55-8217-4fbc041831d9',
  '7b97668c-5655-454b-8de5-00b88093ecb7',
  '4d0714c8-df5e-42a2-8015-fb5f2d861e98',
  'c4e30cd1-a243-4f91-ae94-33a1a186703e'
);

-- 2. Remove seeded skills (exact 54 IDs from seed/02_skills.sql)
DELETE FROM public.skills
WHERE id IN (
  '2b688a30-7e16-4e69-9d76-d78fc8ee9242',
  'a0829456-7b85-43d5-b8ad-07c0b64fd555',
  '26023ce1-47cc-491f-951c-4119bc409445',
  '5a43866d-fe16-46fd-bd16-9af956c77611',
  'e4441c02-4706-4209-8e2a-31d6131b689c',
  'b53cb3a7-5b0d-4f58-9364-e2f9f525276d',
  'a7fab84c-2ce8-4c71-a3c9-2bfd03cef534',
  '069a8f3e-53d9-4b1b-b6b9-6b638e3187af',
  '4c8e0bc3-58b2-4fb5-864d-769127e11113',
  '2115feca-7021-400d-a176-042a7bad9f6e',
  '7db9ddca-e8f7-4b50-bb26-1961c69d2a62',
  'c90abd1a-bfaa-4139-85c7-2da8a783579c',
  '086ebe6b-d7e0-438c-969f-f8d23b1d4b2b',
  '135ff814-8d09-4a92-85fb-6c5b60e1981b',
  '8f7fe01f-9e5d-48f9-8953-a69bb7230428',
  'a3a2a594-f70b-4bdf-bbf1-2bc05a55cecd',
  'fe1dd2e1-30c9-4bd1-91b5-1d732d66927e',
  '624d90a9-3811-4f9d-b3c8-be9cf1bce549',
  '051099c5-20b9-4944-8117-1f6882e8b379',
  '99a81e9d-1e22-4519-99e7-32a9e518ac66',
  '94e5842b-de9f-4f46-9ac7-0633f0b7f2dc',
  '7e8fe149-2a17-4bd7-afe5-4de4fb5815ae',
  'ab50d617-4c16-4b1c-abd5-ec8ca8e08336',
  '58dc4459-b1af-485d-a4b7-d652129ad967',
  'db2914d1-4f4c-480c-afb1-9d329b462e31',
  '6a8c758e-bfc8-4f6c-b752-27b6a24e1790',
  '23be4b18-b70d-410e-a571-aa966ccc0b88',
  'aa1f3fcc-2b82-4037-839a-a14d3f04168a',
  '6801ad1a-ea17-445c-9e17-9656916f0690',
  'd89aab13-a643-41d2-8cc5-3bee67b4a3ad',
  'eb34d120-0f44-42bd-9607-29951d34faec',
  '9712b720-789e-47a4-b0bb-bc534b235d9f',
  'ce64f011-e8f1-49c0-bfee-16fbd0781795',
  '0d78f4ec-0776-481a-8487-bd9a7645ead5',
  '95f72b96-51f2-47e7-a0b4-a599569cfa1c',
  '25ab7b7d-e57c-4da3-b264-6485b35cfcf8',
  'ec97952d-d276-4b86-a6c3-af527743a108',
  'e6050229-140c-4f9e-808b-a34dbda3b54c',
  'ddc053e7-9a95-430b-869d-bd36d5627beb',
  '8250e98f-4d32-4c99-86d7-ce7304bcd901',
  '5c5c4f06-4f7a-4246-b44b-2a029b5364dd',
  '2e66c3c3-2c83-4486-b12d-9825417c173a',
  '1b740caa-a965-44ca-8407-787acba75b3e',
  '20d51f10-648a-4ce9-b8c2-542a88974c1e',
  '0375884f-c1b6-4054-ba5d-9d3170a8247a',
  '01a8fe41-8836-4ab8-bac2-cba2d7d1168a',
  'c43191bc-c3f7-46b1-bece-2b8cd3c847c9',
  'bb77d36e-4c46-4adb-aaa4-a6c3077e4380',
  'ecee576d-ab66-4249-9544-d0b9b086e216',
  '6d6f2aa2-771d-4168-b65c-60e3ae2c1da9',
  '191152a2-8b7c-413c-8ff8-b72c73c08415',
  'efa132ed-a690-477c-aa78-4c733afb14fe',
  'c6b9e3c4-ecc1-416e-b9c6-43c8fe9fa8b0',
  'fa69ced5-2772-49d7-8c17-f565f61b46a5'
);

-- 3. Remove seeded site settings inserted by seed
DELETE FROM public.site_settings
WHERE key IN ('homepage', 'hero_developer', 'hero_marketer', 'site_sections');

-- 4. Delete all rows and drop v1-only tables (tools and blogs)
DELETE FROM public.tools;
DROP TABLE IF EXISTS public.tools CASCADE;

DELETE FROM public.blogs;
DROP TABLE IF EXISTS public.blogs CASCADE;

-- 5. Restore original 8 projects to published state
UPDATE public.projects
SET is_published = true;

COMMIT;

