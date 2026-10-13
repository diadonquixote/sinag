-- DEMO DATA ONLY. Fictional people and numbers so you can click through every screen.
-- Run with:  npm run db:seed   (refuses to run if the database already has users)
-- {{SEED_PASSWORD}} is replaced by scripts/db-setup.mjs.

do $$
begin
  if exists (select 1 from users) then
    raise exception 'The database already has users. The demo seed is for an empty database.';
  end if;
end $$;

create or replace function pg_temp.today() returns date language sql as
$$ select (now() at time zone 'Asia/Manila')::date $$;

-- ---------------------------------------------------------------- users
insert into users (id, name, email, password_hash, role, barangay) values
  (1, 'Maria Reyes',      'chair@sinag.demo',     crypt('{{SEED_PASSWORD}}', gen_salt('bf', 10)), 'chairperson', 'Demo Barangay'),
  (2, 'Jose Cruz',        'secretary@sinag.demo', crypt('{{SEED_PASSWORD}}', gen_salt('bf', 10)), 'secretary',   'Demo Barangay'),
  (3, 'Ana Santos',       'treasurer@sinag.demo', crypt('{{SEED_PASSWORD}}', gen_salt('bf', 10)), 'treasurer',   'Demo Barangay'),
  (4, 'Paolo Dela Cruz',  'kagawad@sinag.demo',   crypt('{{SEED_PASSWORD}}', gen_salt('bf', 10)), 'kagawad',     'Demo Barangay'),
  (5, 'Bea Bautista',     'kagawad2@sinag.demo',  crypt('{{SEED_PASSWORD}}', gen_salt('bf', 10)), 'kagawad',     'Demo Barangay'),
  (6, 'Lia Mendoza',      'youth1@sinag.demo',    crypt('{{SEED_PASSWORD}}', gen_salt('bf', 10)), 'kabataan',    'Demo Barangay'),
  (7, 'Marco Villanueva', 'youth2@sinag.demo',    crypt('{{SEED_PASSWORD}}', gen_salt('bf', 10)), 'kabataan',    'Demo Barangay'),
  (8, 'Joy Ramos',        'youth3@sinag.demo',    crypt('{{SEED_PASSWORD}}', gen_salt('bf', 10)), 'kabataan',    'Demo Barangay'),
  (9, 'Site Admin',       'admin@sinag.demo',     crypt('{{SEED_PASSWORD}}', gen_salt('bf', 10)), 'admin',       null);

-- Profile details for the demo people
update users set committee = 'Presiding officer', purok = 'Purok 3', bio = 'SK Chairperson. Studying public administration and coaching the barangay volleyball team on weekends.' where id = 1;
update users set committee = 'Secretariat', purok = 'Purok 1', bio = 'Keeps the minutes and the records. Ask me for copies of any resolution.' where id = 2;
update users set committee = 'Committee on Appropriations', purok = 'Purok 2', bio = 'Treasurer. Every peso in and out goes in the ledger, with a receipt.' where id = 3;
update users set committee = 'Committee on Livelihood', purok = 'Purok 4', bio = 'Point person for the livelihood training. Small business owner.' where id = 4;
update users set committee = 'Committee on Environment', purok = 'Purok 5', bio = 'Runs the clean-up drives. Bring gloves!' where id = 5;
update users set purok = 'Purok 2', skills = 'First aid, event photos', bio = 'College student, first aid trained.' where id = 6;
update users set purok = 'Purok 5', skills = 'Carpentry, driving' where id = 7;
update users set purok = 'Purok 1', skills = 'Painting, social media' where id = 8;
update users set term = '2023 to 2026' where id between 1 and 5;
update users set
  credentials = E'BS Public Administration, 3rd year, PUP\nSK Mandatory Training, DILG (2023)\nBarangay Youth Leadership Awardee (2024)',
  contributions = E'Started monthly open forums for kabataan\nSecured a local cooperative donation for school repairs\nPushed every SK document onto Sinag so anyone can read it'
  where id = 1;
update users set
  credentials = E'BS Office Administration graduate\nRecords management seminar, municipal government (2024)',
  contributions = E'Recorded and published every session\'s minutes within a week\nDigitized past resolutions from 2023'
  where id = 2;
update users set
  credentials = E'BS Accountancy, 4th year\nSK Financial Management Training, DBM (2023)',
  contributions = E'Keeps a receipt for every peso spent\nPublishes a monthly plain-language financial report'
  where id = 3;
update users set
  credentials = E'Small business owner (food stall)\nTESDA Food Processing NC II',
  contributions = E'Organized the youth livelihood training with TESDA trainers'
  where id = 4;
update users set
  credentials = E'BS Environmental Science student\nCommunity first responder training (2024)',
  contributions = E'Led the Ilog clean-up drives\nRepaired 30 school chairs during Brigada Eskwela'
  where id = 5;

insert into settings (key, value) values ('total_fund', '500000');

-- ---------------------------------------------------------------- ideas
insert into ideas (id, author_id, title, description, category, est_budget, status, review_note, created_at) values
  (1, 6, 'Youth Livelihood Training',
      'A two-day hands-on training in food processing and basic bookkeeping so out-of-school youth can start small home businesses.',
      'Kabuhayan', 28000, 'proposed', null, now() - interval '40 days'),
  (2, 7, 'Ilog Clean-up Drive',
      'Monthly clean-up of the creek behind the barangay hall, with youth volunteers, sacks, gloves and a segregation lesson.',
      'Kalikasan', 9500, 'proposed', null, now() - interval '39 days'),
  (3, 8, 'Inter-Purok Basketball League',
      'A summer-to-rainy-season league that keeps youth active and brings every purok together. Includes referees and trophies.',
      'Palakasan', 35000, 'proposed', null, now() - interval '38 days'),
  (4, 6, 'Mental Health Awareness Forum',
      'A half-day forum with a licensed guidance counselor, peer-listener training, and a safe space for youth to talk.',
      'Kalusugan', 15000, 'proposed', null, now() - interval '37 days'),
  (5, 7, 'Free Wi-Fi Study Hub',
      'Open the barangay hall annex after school with tables, outlets and free Wi-Fi so students can do modules and research.',
      'Edukasyon', 42000, 'polling', null, now() - interval '12 days'),
  (6, 8, 'Street Art Mural Project',
      'Youth artists paint a mural along the barangay wall to tell the story of our community.',
      'Sining at Kultura', 18000, 'polling', null, now() - interval '11 days'),
  (7, 6, 'First Aid and CPR Training',
      'Certified first-aid and CPR training for 50 youth volunteers so every purok has someone ready to help.',
      'Kalusugan', 22000, 'polling', null, now() - interval '10 days'),
  (8, 7, 'Community Vegetable Garden',
      'Turn the vacant lot beside the court into a youth-run vegetable garden that supplies the feeding program.',
      'Kabuhayan', 16000, 'pending', null, now() - interval '2 days'),
  (9, 8, 'Open-Air Concert',
      'A big concert with guest artists.',
      'Sining at Kultura', 250000, 'rejected',
      'Budget is far above the available fund. Please resubmit a smaller community showcase.', now() - interval '20 days');

-- ---------------------------------------------------------------- polls and votes
insert into polls (id, title, closes_at, status, max_votes, created_at) values
  (1, 'Third quarter project poll', now() - interval '30 days', 'closed', 3, now() - interval '36 days'),
  (2, 'Fourth quarter project poll', now() + interval '10 days', 'open', 3, now() - interval '5 days');

insert into poll_ideas (poll_id, idea_id) values (1,1),(1,2),(1,3),(1,4),(2,5),(2,6),(2,7);

insert into votes (poll_id, idea_id, user_id, created_at) values
  (1, 1, 6, now() - interval '34 days'), (1, 3, 6, now() - interval '34 days'), (1, 2, 6, now() - interval '34 days'),
  (1, 1, 7, now() - interval '33 days'), (1, 2, 7, now() - interval '33 days'), (1, 4, 7, now() - interval '33 days'),
  (1, 1, 8, now() - interval '32 days'), (1, 3, 8, now() - interval '32 days'), (1, 4, 8, now() - interval '32 days'),
  (2, 5, 6, now() - interval '3 days'), (2, 7, 6, now() - interval '3 days'),
  (2, 5, 7, now() - interval '2 days'), (2, 6, 7, now() - interval '2 days'),
  (2, 7, 8, now() - interval '1 days');

-- ---------------------------------------------------------------- projects
insert into projects (id, idea_id, title, description, category, budget, status, proposal, lead_id, location, start_date, end_date, progress, created_at) values
  (1, null, 'Brigada Eskwela Support',
      'Paint, repair and supplies to help the elementary school get ready for the opening of classes.',
      'Edukasyon', 12000, 'completed', null, 5, 'Barangay Elementary School',
      pg_temp.today() - 38, pg_temp.today() - 36, 100, now() - interval '60 days'),
  (2, 1, 'Youth Livelihood Training',
      'A two-day hands-on training in food processing and basic bookkeeping for out-of-school youth.',
      'Kabuhayan', 28000, 'scheduled',
      '{"beneficiaries":"40 out-of-school youth, ages 15 to 30","duration":"2 days","objectives":["Teach 40 youth to prepare and package three food products","Give every participant a simple bookkeeping template","Connect graduates to the barangay market day"],"activities":[{"name":"Day 1: Food processing workshop","description":"Hands-on production of three food products with a TESDA-accredited trainer."},{"name":"Day 2: Bookkeeping and pricing","description":"Costing, pricing and a simple record-keeping template."}],"budget_lines":[{"item":"Trainer honorarium","qty":2,"unit":"day","unit_cost":4000},{"item":"Ingredients and packaging","qty":40,"unit":"participant","unit_cost":250},{"item":"Food for participants","qty":80,"unit":"meal","unit_cost":120},{"item":"Printing and certificates","qty":40,"unit":"set","unit_cost":60}],"expected_outcomes":["At least 25 participants start selling within two months"],"risks":["Rain on market day — move the showcase to the covered court"],"template":false}'::jsonb,
      4, 'Barangay Hall Multipurpose Room', pg_temp.today() + 6, pg_temp.today() + 7, 0, now() - interval '28 days'),
  (3, 2, 'Ilog Clean-up Drive',
      'Clean-up of the creek behind the barangay hall, with segregation lesson for volunteers.',
      'Kalikasan', 9500, 'ongoing',
      '{"beneficiaries":"Residents along the creek and 60 youth volunteers","duration":"3 weekends","objectives":["Remove solid waste from the creek bank","Teach waste segregation to volunteers"],"activities":[{"name":"Weekend clean-ups","description":"Volunteers clear the creek bank in teams by purok."}],"budget_lines":[{"item":"Gloves and sacks","qty":60,"unit":"set","unit_cost":60},{"item":"Snacks and water","qty":120,"unit":"pack","unit_cost":45},{"item":"Tools and disposal","qty":1,"unit":"lot","unit_cost":500}],"expected_outcomes":["Creek bank cleared and monitored monthly"],"risks":["Heavy rain — reschedule to the next weekend"],"template":false}'::jsonb,
      5, 'Creek behind the Barangay Hall', pg_temp.today() - 2, pg_temp.today() + 5, 40, now() - interval '20 days'),
  (4, 3, 'Inter-Purok Basketball League',
      'A league that brings every purok together. Includes referees, trophies and a medical station.',
      'Palakasan', 35000, 'scheduled',
      '{"beneficiaries":"8 puroks, about 120 players","duration":"1 week","objectives":["Keep youth active and in school","Build friendships across puroks"],"activities":[{"name":"Group stage and finals","description":"Eight teams, round robin, then a championship night."}],"budget_lines":[{"item":"Referees and scorekeepers","qty":10,"unit":"game","unit_cost":800},{"item":"Trophies and medals","qty":1,"unit":"lot","unit_cost":9000},{"item":"Balls, jerseys numbers, nets","qty":1,"unit":"lot","unit_cost":12000},{"item":"Water and first aid","qty":1,"unit":"lot","unit_cost":6000}],"expected_outcomes":["Eight teams complete the season"],"risks":["Rain — use the covered court"],"template":false}'::jsonb,
      5, 'Barangay Covered Court', pg_temp.today() + 18, pg_temp.today() + 24, 0, now() - interval '25 days'),
  (5, 4, 'Mental Health Awareness Forum',
      'A half-day forum with a licensed guidance counselor and peer-listener training.',
      'Kalusugan', 15000, 'proposed',
      '{"beneficiaries":"80 youth and parents","duration":"Half day","objectives":["Reduce stigma around mental health","Train 20 peer listeners"],"activities":[{"name":"Forum and workshop","description":"Talk, small-group workshop, and referral information."}],"budget_lines":[{"item":"Speaker honorarium","qty":1,"unit":"lot","unit_cost":5000},{"item":"Materials and printing","qty":80,"unit":"set","unit_cost":50},{"item":"Snacks","qty":100,"unit":"pack","unit_cost":60}],"expected_outcomes":["20 trained peer listeners"],"risks":["Sensitive topics — a counselor is present throughout"],"template":false}'::jsonb,
      null, null, null, null, 0, now() - interval '5 days');

insert into project_updates (project_id, author_id, body, progress, created_at) values
  (1, 5, 'All classrooms repainted and 30 chairs repaired. Thank you to the 25 youth volunteers who gave their weekend!', 100, now() - interval '35 days'),
  (3, 5, 'Weekend 1 done: 42 sacks of waste collected from the creek bank. 31 volunteers joined.', 40, now() - interval '1 days');

insert into project_volunteers (project_id, user_id) values (3, 6), (3, 7), (2, 8);

-- ---------------------------------------------------------------- ledger
insert into transactions (project_id, kind, amount, description, category, tx_date, reference, created_by) values
  (1, 'expense', 4200, 'Paint and brushes', 'Materials', pg_temp.today() - 36, 'OR-0412', 3),
  (1, 'expense', 5150, 'Chair repair materials', 'Materials', pg_temp.today() - 36, 'OR-0413', 3),
  (1, 'expense', 2000, 'Snacks for volunteers', 'Food', pg_temp.today() - 36, 'OR-0414', 3),
  (null, 'income', 5000, 'Sponsor donation (local cooperative)', 'Donation', pg_temp.today() - 33, 'DON-021', 3),
  (3, 'expense', 1800, 'Gloves and sacks', 'Materials', pg_temp.today() - 3, 'OR-0431', 3),
  (3, 'expense', 1400, 'Snacks and water for volunteers', 'Food', pg_temp.today() - 2, 'OR-0432', 3);

-- ---------------------------------------------------------------- minutes
insert into minutes (id, title, session_date, raw_notes, content, data, status, author_id, published_by, published_at, created_at) values
  (1, 'Regular Session — Youth Projects and Budget', pg_temp.today() - 12,
   E'Present: Chair Reyes, Sec Cruz, Tres Santos, Kgd Dela Cruz, Kgd Bautista\nCalled to order 2:05pm\n1) Livelihood training approved, 28k\n2) Clean up drive approved 9.5k\n3) Basketball league approved 35k\nAdjourned 3:40pm',
   E'# Regular Session — Youth Projects and Budget\n\n## Summary\nThe council approved three youth projects from the third quarter poll: the Youth Livelihood Training, the Ilog Clean-up Drive and the Inter-Purok Basketball League.\n\n## Attendance\n- Present: Chair Reyes, Sec Cruz, Tres Santos, Kgd Dela Cruz, Kgd Bautista\n\n## Agenda\n- Youth Livelihood Training\n- Ilog Clean-up Drive\n- Inter-Purok Basketball League\n\n## Decisions\n- Approved the Youth Livelihood Training with a budget of PHP 28,000.\n- Approved the Ilog Clean-up Drive with a budget of PHP 9,500.\n- Approved the Inter-Purok Basketball League with a budget of PHP 35,000.\n\n## Action items\n- Kgd Dela Cruz to lead the livelihood training.\n- Kgd Bautista to coordinate the clean-up drive and the basketball league.\n\nCalled to order at 2:05 PM. Adjourned at 3:40 PM.',
   '{"summary":"The council approved three youth projects from the third quarter poll.","budget_items":[{"description":"Youth Livelihood Training","amount":28000},{"description":"Ilog Clean-up Drive","amount":9500},{"description":"Inter-Purok Basketball League","amount":35000}],"budget_check":{"total":72500,"available":421150,"over":false},"used_ai":false}'::jsonb,
   'published', 2, 1, now() - interval '11 days', now() - interval '12 days'),
  (2, 'Special Session — Mental Health Forum', pg_temp.today() - 3,
   E'Special session called by Chair. Topic: mental health forum proposal from poll 1 winner. Guidance counselor to be invited. Budget around 15k. Needs approval next session.',
   E'# Special Session — Mental Health Forum\n\n## Summary\nThe council reviewed the Mental Health Awareness Forum proposal and agreed to invite a guidance counselor.\n\n## Decisions\n- The proposal goes to the chairperson for approval of its budget of about PHP 15,000.',
   '{"summary":"The council reviewed the Mental Health Awareness Forum proposal.","budget_items":[{"description":"Mental Health Awareness Forum","amount":15000}],"budget_check":{"total":15000,"available":421150,"over":false},"used_ai":false}'::jsonb,
   'pending', 2, null, null, now() - interval '3 days'),
  (3, 'Committee meeting — Wi-Fi Study Hub', pg_temp.today() - 1,
   E'Met with kgd bautista re wifi study hub. need quotes from 2 providers. check electrical load. maybe 40k+.',
   E'# Committee meeting — Wi-Fi Study Hub\n\n## Summary\nThe committee discussed the Free Wi-Fi Study Hub and agreed to collect quotes.\n\n## Action items\n- Get quotes from two providers.\n- Check the electrical load of the annex.',
   '{"summary":"The committee discussed the Free Wi-Fi Study Hub.","budget_items":[],"used_ai":false}'::jsonb,
   'draft', 2, null, null, now() - interval '1 days');

-- ---------------------------------------------------------------- report
insert into reports (id, title, period, content, data, status, author_id, published_by, published_at, created_at)
select 1,
  'Financial report — last month',
  to_char(pg_temp.today() - 45, 'FMMon FMDD, YYYY') || ' to ' || to_char(pg_temp.today() - 31, 'FMMon FMDD, YYYY'),
  E'In this period the SK received PHP 5,000 from a local cooperative and spent PHP 11,350, all on the Brigada Eskwela Support project. The project closed under its PHP 12,000 budget.\n\nPaglalahad: ang buong gastos ay para sa pintura, pag-aayos ng mga upuan at meryenda ng mga boluntaryo.',
  format('{"period":{"from":"%1$s","to":"%2$s"},"income":5000,"expense":11350,"net":-6350,"fund":{"total":500000,"committed":69300,"available":421150},"byCategory":[{"category":"Materials","amount":9350},{"category":"Food","amount":2000}],"byProject":[{"project":"Brigada Eskwela Support","budget":12000,"spent":11350}],"lines":[{"date":"%3$s","kind":"expense","description":"Paint and brushes","category":"Materials","project":"Brigada Eskwela Support","amount":4200,"reference":"OR-0412"},{"date":"%3$s","kind":"expense","description":"Chair repair materials","category":"Materials","project":"Brigada Eskwela Support","amount":5150,"reference":"OR-0413"},{"date":"%3$s","kind":"expense","description":"Snacks for volunteers","category":"Food","project":"Brigada Eskwela Support","amount":2000,"reference":"OR-0414"},{"date":"%4$s","kind":"income","description":"Sponsor donation (local cooperative)","category":"Donation","project":null,"amount":5000,"reference":"DON-021"}],"flags":[],"used_ai":false}',
    to_char(pg_temp.today() - 45, 'YYYY-MM-DD'), to_char(pg_temp.today() - 31, 'YYYY-MM-DD'),
    to_char(pg_temp.today() - 36, 'YYYY-MM-DD'), to_char(pg_temp.today() - 33, 'YYYY-MM-DD'))::jsonb,
  'published', 3, 1, now() - interval '9 days', now() - interval '10 days';

-- ---------------------------------------------------------------- audit trail
insert into audit_log (user_id, action, entity, entity_id, detail, created_at) values
  (1, 'published', 'minutes', 1, 'Regular Session — Youth Projects and Budget', now() - interval '11 days'),
  (1, 'published', 'report', 1, 'Financial report — last month', now() - interval '9 days'),
  (1, 'approved', 'project', 2, 'Youth Livelihood Training', now() - interval '25 days');

-- keep serial counters in step with the explicit ids above
select setval(pg_get_serial_sequence('users','id'), (select max(id) from users));
select setval(pg_get_serial_sequence('ideas','id'), (select max(id) from ideas));
select setval(pg_get_serial_sequence('polls','id'), (select max(id) from polls));
select setval(pg_get_serial_sequence('projects','id'), (select max(id) from projects));
select setval(pg_get_serial_sequence('minutes','id'), (select max(id) from minutes));
select setval(pg_get_serial_sequence('reports','id'), (select max(id) from reports));
