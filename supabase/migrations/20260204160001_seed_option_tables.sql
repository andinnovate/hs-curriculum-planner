INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('NAB (v2)', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books; add to the appropriate category under Language Arts)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- My Side of the Mountain by Jean Craighead\\n- To Kill a Mockingbird by Harper Lee*\\n*Contains sensitive subject matter."}]'::jsonb
FROM unit_option_groups WHERE unit = 'NAB (v2)' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', 20.0, '[{"description": "- The Silver Chair: Chronicles of Narnia, Book 6by C.S. Lewis\\n- The Eagle of the Ninth: The Roman Britain Trilogy, Book #1"}]'::jsonb
FROM unit_option_groups WHERE unit = 'NAB (v2)' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Unsolved Mysteries', 'Language Arts', 'Required Reading', '(1 hour per day; add to the appropriate category under Language Arts)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- Left Behind series by Tim LaHaye and Jerry B. Jenkins\\n- The Case for Christ Student Edition by Lee Strobel"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Unsolved Mysteries' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', 20.0, '[{"description": "- The Extraordinary Cases of Sherlock Holmes by Sir Arthur Conan Doyle"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Unsolved Mysteries' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Ocean Life', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books; add to the appropriate category under Language Arts)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- Soul Surfer: A True Story of Faith, Family, and Fighting to Get Back on the Board by Bethany Hamilton\\n- Island of the Blue Dolphinsby Scott O''Dell"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Ocean Life' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'Classical Literature', 20.0, '[{"description": "- 20,000 Leagues Under the Sea by Jules Verne"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Ocean Life' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Renaissance + Revival', 'Language Arts', 'Required Reading', '(1 hour per day; choose your book)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', NULL, '[{"description": "- Animal Farm by George Orwell\\n- The Essays by Francis Bacon"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Renaissance + Revival' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', NULL, '[{"description": "- The Giant: A Novel of Michelangelo''s David by Laura Morelli"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Renaissance + Revival' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Sports + PE', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books; already added to American Literature)\\n\\n- Joni: An Unforgettable Story by Joni Eareckson Tada\\n- Beneath the Surface: My Story by Michael Phelps\\n- Heart of a Champion: True Stories of Character and Faith from Today''s Most Inspiring Athletes by Steve Riach');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Indigenous Peoples', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books; already added to American Literature)\\n\\n- Julie of the Wolves by Jean Craighead George\\n- The Birchbark House by Louise Erdich\\n- The Sign of the Beaver by Elizabeth George Speare\\n- Pemmican Wars: A Girl Called Echo by Katherena Vermette, Scott B. Henderson, and Donovan Yaciuk');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Asia', 'Language Arts', 'Required Reading', 'Choose your book, read 1 hour per day and assign 20 hours to appropriate category:');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- Sadako and the Thousand Paper Cranes by Pam Gelman"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Asia' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', 20.0, '[{"description": "- God''s Adventurer: Hudson Taylor by Phyllis Thompson"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Asia' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'Classical Literature', 20.0, '[{"description": "- The Hiding Place by Corrie Ten Boom"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Asia' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Artists', 'Language Arts', 'Required Reading', '(1 hour per day; add 20 hours to the appropriate category)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- A Collection of Poems by Robert Frost by Robert Frost\\n- Me, Myself, and Bob by Phil Vischer\\n- Hinds Feet on High Places by Hannah Hurnard"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Artists' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', 20.0, '[{"description": "- Macbeth by William Shakespeare\\n- The Screwtape Letters by C.S. Lewis\\n- Mere Christianity by C.S. Lewis\\n- The Chronicles of Narnia by C.S. Lewis"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Artists' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'Classical Literature', 20.0, '[{"description": "- Pilgrim''s Progress by John Bunyan"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Artists' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('US History 1', 'Language Arts', 'Required Reading', '(1 hour per day; already added to American Literature)\\n\\n- Pocahontas by Joseph Bruchac\\n- The King''s Fifth by Scott O''Dell\\n- The First Frontier: The Forgotten History of Struggle, Savagery, and Endurance in Early America by Scott Weidensaul');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Rocks + Minerals', 'Language Arts', 'Required Reading', '(1 hour per day; already added to American Literature)\\n\\n- Trapped: How the World Rescued 33 Miners from 2,000 Feet Below the Chilean Desert by Marc Aronson\\n- Where the Mountain Meets the Moon by Grace Lin\\n- One Giant Leap: The Untold Story of How We Flew to the Moon by Charles Fishman');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('US History 2', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books; already added to American Literature)\\n\\n- Chains by Laurie Halse Anderson\\n- Johnny Tremain by Esther Hoskins Forbes\\n- Star-Spangled: The Story of a Flag, a Battle, and the American Anthem by Tim Grove');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Astronomy', 'Language Arts', 'Required Reading', '(1 hour per day; already added to American Literature) \\n\\n- Hidden Figures by Margot Lee Shetterly \\n- My Remarkable Journey: A Memoir by Katherine Johnson');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('US History 3', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books; already added to American Literature)\\n\\n- Across Five Aprils by Irene Hunt\\n- The Birchbark House by Louise Erdich\\n- Walden by Henry David Thoreau\\n- Young Lincoln by Jan Jacobi');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('South America', 'Language Arts', 'Required Reading', '(1 hour per day; hours added to American Lit)\\n\\n- The Case for Christ by Lee Strobel\\n- The End of the Spear by Steve Saint\\n- Pelé: The Autobiography by Pelé');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Living off the Land', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books; already added to American Literature)\\n\\n- Hattie Big Skyby Kirby Larson\\n- Prairie Lotus by Linda Sue Park\\n- Pioneer Girl: The Annotated Autobiography by Laura Ingalls Wilder\\n- Stories from the Old Squire''s Farm: A Collection of Short Stories of Life in Rural New England by C. Stephens');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Chemistry', 'Language Arts', 'Required Reading', '(already added to American Literature)\\n\\n- The Disappearing Spoon by Sam Kean\\n\\nComplete a book report or essay\\n\\n(hours have been added to final total)');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Inventions + Ideas', 'Language Arts', 'Required Reading', '(1 hour per day; add 20 hours to the appropriate category)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- The Wright Brothers by David McCullough\\n- The Invention of Hugo Cabret by Brian Selznick\\n- The Giver by Lois Lowry\\n- Ender''s Game by Orson Scott Card"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Inventions + Ideas' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', 20.0, '[{"description": "- Frankensteinby Mary Shelley"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Inventions + Ideas' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Life Skills', 'Language Arts', 'Required Reading', '(1 hour per day; add 20 hours to the appropriate category)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', 20.0, '[{"description": "- The Screwtape Letters by C.S. Lewis"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Life Skills' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- To Kill a Mockingbird by Harper Lee\\n- Wonder by R.J. Palacio"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Life Skills' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Europe', 'Language Arts', 'Required Reading', '(1 hour per day; 20 hours added to Classic Lit)\\n\\n- The Hiding Place by Corrie Ten Boom\\n- The Diary of a Young Girl by Anne Frank\\n- God''s Smuggler by Brother Andrew\\n- Fairy Tales by Hans Christian Andersen');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('US History 4', 'Language Arts', 'Required Reading', '(1 hour per day; add 20 hours to the appropriate category)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- The Adventures of Tom Sawyer by Mark Twain\\n- A Farewell to Arms: The Hemingway Library Edition by Ernest Hemingway\\n- The Grapes of Wrath by John Steinbeck\\n- Unbroken: A World War II Story of Survival, Resilience, and Redemption by Lauren Hillenbrand"}]'::jsonb
FROM unit_option_groups WHERE unit = 'US History 4' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', 20.0, '[{"description": "- The Boy in the Striped Pajamas by John Boyne"}]'::jsonb
FROM unit_option_groups WHERE unit = 'US History 4' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Energy', 'Language Arts', 'Required Reading', '(hours already added to American Literature)\\n\\n- The Boy Who Harnessed the Wind by William Kamkwamba\\n\\nComplete a book report or essay\\n\\n(hours have been added to final total)');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Music', 'Language Arts', 'Required Reading', '(1 hour per day; add 20 hours to the appropriate category)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- Live Like a Jesus Freak: Spend Today as if it Were Your Last by dc Talk"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Music' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'Classical Literature', 20.0, '[{"description": "- The Wizard of Oz by L. Frank Baum\\n- Little Women by Louisa May Alcott"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Music' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', 20.0, '[{"description": "- Reflections on the Psalms by C.S. Lewis"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Music' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('US History 5', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books; already added to American Literature)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', NULL, '[{"description": "- Truman by David McCullough\\n- Roll of Thunder, Hear My Cry by Mildred D. Taylor\\n- The Selected Poems of Wendell Berryby Wendell Berry"}]'::jsonb
FROM unit_option_groups WHERE unit = 'US History 5' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'Classical Literature', NULL, '[{"description": "- Around the World in 80 Days by Jules Verne\\n- Robinson Crusoe by Daniel Defoe"}]'::jsonb
FROM unit_option_groups WHERE unit = 'US History 5' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Transportation', 'Language Arts', 'Required Reading', '(1 hour per day; add 20 hours to the appropriate category)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- Flying to the Moon: An Astronaut''s Story by Michael Collins"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Transportation' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'Classical Literature', 20.0, '[{"description": "- Around the World in 80 Days by Jules Verne\\n- Robinson Crusoe by Daniel Defoe"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Transportation' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('US History 6', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books; already added to American Literature)\\n\\n- Let''s Roll! Ordinary People, Extraordinary Change by Lisa Beamer\\n- How the Internet Happened: From Netscape to iPhone by David McCullough');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Intro to Psychology', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- Bridge to Terabithia by Katherine Paterson\\n- Endurance: My Year in Space, A Lifetime of Discovery by Scott Kelly\\n- Unplanned: The Dramatic True Story of a Former Planned Parenthood Leader''s Eye-Opening Journey Across the Life Line by Abby Johnson"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Intro to Psychology' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', 20.0, '[{"description": "- The King''s War by Mark Logue + Peter Conradi\\n- The Strange Case of Dr. Jekyll and Mr. Hyde by Robert Louis Stevenson\\n- Alice''s Adventures in Wonderland and Through the Looking Glass by Lewis Carroll"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Intro to Psychology' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('US Government', 'Language Arts', 'Required Reading', '(1 hour per day; already added to American Literature)\\n\\n- 1776 by David McCullough\\n- This is Our Constitution: What It Is and Why It Matters by Khizr Khan\\n- My Brother Sam is Dead by James Lincoln Collier');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Earth Science', 'Language Arts', 'Required Reading', '(1 hour per day; add 20 hours to the appropriate category)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- The Long Winter by Laura Ingalls Wilder\\n- The Wonderful Wizard of Ozby L. Frank Baum\\n- No Summit Out of Sight by Jordan Romero"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Earth Science' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'Classical Literature', 20.0, '[{"description": "- Journey to the Center of the Earth by Jules Verne"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Earth Science' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Entrepreneurship', 'Language Arts', 'Required Reading', '(1 hour per day; hours added to American Lit category)\\n\\n- The Coolest Startups in America by Doreen Bloch\\n- The Everything Store: Jeff Bezos and the Age of Amazon by Brad Stone\\n- The Disney Story: Chronicling the Man, the Mouse, and the Parks by Aaron H. Goldberg\\n- Chocolate by Hershey: A Story about Milton S. Hershey by Betty M. Burford');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Dinosaurs', 'Language Arts', 'Required Reading', '(1 hour per day; add 20 hours to appropriate category)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', 20.0, '[{"description": "- The Fossil Woman: A Life of Mary Anning by Tom Sharpe\\n- The Lost World by Sir Arthur Conan Doyle"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Dinosaurs' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- How to Build a Dinosaur by Jack Horner"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Dinosaurs' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Human Body', 'Language Arts', 'Required Reading', '(1 hour per day; added 20 hours to American Lit)\\n\\n- Pollyanna by Eleanor H. Porter\\n- Rules by Cynthia Lord\\n- The Story of My Life by Hellen Keller + Candace Ward\\n- The Young Unicorns by Madeline L''Engle');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Farming + Food', 'Language Arts', 'Required Reading', '(1 hour per day; hours added to American Literature)\\n\\n- The Keeper of the Bees by Gene Stratton-Porter\\n- The Yearlingby Marjorie Kinnan Rawlings\\n- Bonhoeffer: Pastor, Martyr, Prophet, Spy by Eric Metaxas');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Careers + Trades', 'Language Arts', 'Required Reading', '(hours already added to American Literature) - see book list in app');

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('NA Forest Animals', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books and assign 20 hours to appropriate category)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'American Literature', 20.0, '[{"description": "- Julie of the Wolves by Jean Craighead George\\n- The Call of the Wild by Jack London\\n- Of Courage Undaunted: Across the Continent with Lewis and Clark by James Daugherty\\n- Where the Red Fern Grows by Wilson Rawls"}]'::jsonb
FROM unit_option_groups WHERE unit = 'NA Forest Animals' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'British Literature', 20.0, '[{"description": "- The Taming of the Shrew by William Shakespeare"}]'::jsonb
FROM unit_option_groups WHERE unit = 'NA Forest Animals' AND label = 'Required Reading';
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'Classical Literature', 20.0, '[{"description": "- Just So Stories by Rudyard Kipling"}]'::jsonb
FROM unit_option_groups WHERE unit = 'NA Forest Animals' AND label = 'Required Reading';

INSERT INTO unit_option_groups (unit, category, label, note)
VALUES ('Africa', 'Language Arts', 'Required Reading', '(1 hour per day; choose your books)');
INSERT INTO unit_option_choices (option_group_id, subcategory, hours, recommended_books)
SELECT id, 'Classical Literature', 20.0, '[{"description": "- Another Man''s War by Sam Childers\\n- A Long Walk to Water by Linda Sue Park\\n- David Livingstone: Africa''s Trailblazer by Janet Benge + Geoff Benge\\n- Long Walk to Freedom: The Autobiography of Nelson Mandela by Nelson Mandela"}]'::jsonb
FROM unit_option_groups WHERE unit = 'Africa' AND label = 'Required Reading';
