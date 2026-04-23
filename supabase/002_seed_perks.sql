-- ╔══════════════════════════════════════════════════════════════╗
-- ║  PERKI — Seed Data                                          ║
-- ║  Run this AFTER 001_schema.sql in the Supabase SQL Editor    ║
-- ╚══════════════════════════════════════════════════════════════╝

insert into public.perks (perk_id, provider, membership, tier, title, description, category, reset_period, next_reset_date, usage_limit, popularity, source_url, last_verified) values
-- OVO Energy — Beyond
('ovo-beyond-costa-coffee','OVO Energy','OVO Energy','Beyond','Free Costa Coffee','Claim a free small drink at Costa Coffee each month via the OVO app.','retail','MONTHLY','2026-05-01','1 per month','Common','https://www.ovoenergy.com/beyond','2026-04-22'),
('ovo-beyond-power-move','OVO Energy','OVO Energy','Beyond','Power Move Prize Draw','Win up to a year''s free energy by shifting electricity usage to off-peak times.','finance','MONTHLY','2026-05-01','Ongoing monthly draw','Common','https://www.ovoenergy.com/beyond','2026-04-22'),
('ovo-beyond-uber-green','OVO Energy','OVO Energy','Beyond','£5 Uber Green Voucher','£5 off an Uber Green ride each month for Beyond customers.','travel','MONTHLY','2026-05-01','1 per month','Common','https://www.ovoenergy.com/beyond','2026-04-22'),
('ovo-beyond-vip-tickets','OVO Energy','OVO Energy','Beyond','VIP Ticket Access','Exclusive access to VIP tickets at The O2, OVO Arena Wembley, and OVO Hydro.','retail','NONE',null,'Subject to availability','Occasional','https://www.ovoenergy.com/beyond/extra-perks','2026-04-22'),
('ovo-beyond-boiler-service','OVO Energy','OVO Energy','Beyond','Free Annual Boiler Service','One free boiler service per year for Beyond customers.','other','ANNUALLY','2027-01-01','1 per year','Common','https://www.ovoenergy.com/beyond','2026-04-22'),
('ovo-beyond-tesco-clubcard','OVO Energy','OVO Energy','Beyond','Tesco Clubcard Points','Earn Tesco Clubcard points on energy usage.','supermarket','MONTHLY','2026-05-01','Ongoing','Common','https://www.ovoenergy.com/beyond','2026-04-22'),
('ovo-beyond-oddbox-discount','OVO Energy','OVO Energy','Beyond','Oddbox Discount','Discounts of up to 40% on Oddbox fruit and veg boxes.','retail','NONE',null,'Ongoing','Unknown','https://www.ovoenergy.com/beyond/extra-perks','2026-04-22'),

-- Monzo — Perks
('monzo-perks-greggs-weekly','Monzo','Monzo','Perks','Weekly Greggs Treat','Claim a free sausage roll, hot drink, doughnut or muffin from Greggs every week.','retail','WEEKLY','2026-04-27','1 per week','Common','https://monzo.com/blog/make-monzo-more-you','2026-04-22'),
('monzo-perks-railcard','Monzo','Monzo','Perks','Annual Railcard','Free annual Railcard from Trainline saving 1/3 on eligible train journeys.','travel','ANNUALLY','2027-01-01','1 per year','Common','https://monzo.com/blog/make-monzo-more-you','2026-04-22'),
('monzo-perks-billsback','Monzo','Monzo','Perks','Billsback™','Monthly chance to have eligible bills paid back, up to £150 per bill.','finance','MONTHLY','2026-05-01','Monthly draw','Occasional','https://monzo.com/current-account/plans','2026-04-22'),
('monzo-perks-savings-rate','Monzo','Monzo','Perks','Boosted Savings (3.25% AER)','3.25% AER (variable) on Instant Access Savings Pot and Cash ISA.','finance','NONE',null,'Ongoing','Common','https://monzo.com/blog/make-monzo-more-you','2026-04-22'),
('monzo-perks-fee-free-withdrawals','Monzo','Monzo','Perks','Fee-Free UK/EEA Withdrawals','Unlimited fee-free cash withdrawals in UK/EEA, £600/30d elsewhere.','finance','MONTHLY','2026-05-01','Unlimited UK/EEA','Common','https://monzo.com/blog/make-monzo-more-you','2026-04-22'),

-- Monzo — Max
('monzo-max-travel-insurance','Monzo','Monzo','Max','Worldwide Travel Insurance','Comprehensive worldwide travel insurance. Family cover +£5/month.','insurance','NONE',null,'Ongoing','Common','https://monzo.com/blog/make-monzo-more-you','2026-04-22'),
('monzo-max-phone-insurance','Monzo','Monzo','Max','Phone Insurance','Worldwide phone insurance for phones up to £2,000.','insurance','NONE',null,'Ongoing','Common','https://monzo.com/blog/make-monzo-more-you','2026-04-22'),
('monzo-max-breakdown-cover','Monzo','Monzo','Max','UK & Europe Breakdown Cover','RAC breakdown cover included for UK and Europe.','travel','NONE',null,'Ongoing','Common','https://monzo.com/blog/make-monzo-more-you','2026-04-22'),

-- Revolut — Premium
('revolut-premium-travel-insurance','Revolut','Revolut','Premium','Medical Travel Insurance','Emergency medical insurance abroad.','insurance','NONE',null,'Ongoing','Common','https://www.revolut.com/our-pricing-plans/','2026-04-22'),
('revolut-premium-atm-withdrawals','Revolut','Revolut','Premium','Fee-Free ATM (£400/mo)','Up to £400/month fee-free ATM withdrawals worldwide.','finance','MONTHLY','2026-05-01','£400/month','Common','https://www.revolut.com/our-pricing-plans/','2026-04-22'),
('revolut-premium-currency-exchange','Revolut','Revolut','Premium','Unlimited Currency Exchange','Unlimited interbank-rate currency exchange, no fees.','finance','NONE',null,'Unlimited','Common','https://www.revolut.com/our-pricing-plans/','2026-04-22'),

-- Revolut — Metal
('revolut-metal-atm-800','Revolut','Revolut','Metal','Fee-Free ATM (£800/mo)','Up to £800/month fee-free ATM withdrawals worldwide.','finance','MONTHLY','2026-05-01','£800/month','Common','https://help.revolut.com/help/profile-and-plan/my-plan-benefits/revolut-plans1/metal-plan/','2026-04-22'),
('revolut-metal-travel-insurance','Revolut','Revolut','Metal','Comprehensive Travel Insurance','Global medical, flight delay, lost luggage, winter sports.','insurance','NONE',null,'Ongoing','Common','https://help.revolut.com/help/profile-and-plan/my-plan-benefits/revolut-plans1/metal-plan/','2026-04-22'),
('revolut-metal-revpoints','Revolut','Revolut','Metal','RevPoints (1 per £2)','Earn 1 RevPoint per £2 spent, redeemable for travel perks.','travel','NONE',null,'Ongoing','Common','https://www.revolut.com/our-pricing-plans/','2026-04-22'),
('revolut-metal-savings','Revolut','Revolut','Metal','3.51% AER Savings','Up to 3.51% AER (variable) on instant access savings.','finance','NONE',null,'Ongoing','Common','https://help.revolut.com/help/profile-and-plan/my-plan-benefits/revolut-plans1/metal-plan/','2026-04-22'),

-- Revolut — Ultra
('revolut-ultra-lounge-access','Revolut','Revolut','Ultra','Airport Lounge Access','Unlimited personal airport lounge passes.','airport','NONE',null,'Unlimited','Common','https://www.revolut.com/ultra-plan/','2026-04-22'),
('revolut-ultra-partner-subs','Revolut','Revolut','Ultra','Partner Subscriptions Bundle','FT, WeWork, Uber One, The Athletic, MasterClass, and more.','retail','MONTHLY','2026-05-01','Ongoing','Common','https://www.revolut.com/ultra-plan/','2026-04-22'),
('revolut-ultra-atm-2000','Revolut','Revolut','Ultra','Fee-Free ATM (£2,000/mo)','Up to £2,000/month fee-free ATM withdrawals worldwide.','finance','MONTHLY','2026-05-01','£2,000/month','Common','https://www.revolut.com/ultra-plan/','2026-04-22'),
('revolut-ultra-savings','Revolut','Revolut','Ultra','4% AER Savings','Up to 4.00% AER (variable), paid daily.','finance','NONE',null,'Ongoing','Common','https://www.revolut.com/ultra-plan/','2026-04-22'),
('revolut-ultra-revpoints-1per1','Revolut','Revolut','Ultra','RevPoints (1 per £1)','Earn 1 RevPoint per £1 spent — double the Metal rate.','travel','NONE',null,'Ongoing','Common','https://www.revolut.com/ultra-plan/','2026-04-22'),

-- American Express — Gold
('amex-gold-airport-lounge','American Express','American Express','Gold','Airport Lounge Passes','Four complimentary lounge visits per year.','airport','ANNUALLY','2027-01-01','4 per year','Common','https://www.americanexpress.com/uk/credit-cards/gold-card/','2026-04-22'),
('amex-gold-deliveroo-credit','American Express','American Express','Gold','Deliveroo Credit (£120/yr)','£10 Deliveroo credit each month.','retail','MONTHLY','2026-05-01','£10/month','Common','https://www.americanexpress.com/uk/credit-cards/gold-card/','2026-04-22'),
('amex-gold-hotel-collection','American Express','American Express','Gold','The Hotel Collection','US$100 in-hotel credit and upgrade at 4-5 star hotels.','travel','NONE',null,'Per qualifying stay','Occasional','https://www.americanexpress.com/uk/credit-cards/gold-card/','2026-04-22'),
('amex-gold-double-airline-points','American Express','American Express','Gold','Double Points on Airlines','Double Membership Rewards on direct airline purchases.','travel','NONE',null,'Ongoing','Common','https://www.americanexpress.com/uk/credit-cards/gold-card/','2026-04-22'),

-- American Express — Platinum
('amex-plat-airport-lounge-1','American Express','American Express','Platinum','Priority Pass Lounge Access','Unlimited access to 1,400+ airport lounges.','airport','NONE',null,'Unlimited','Common','https://www.americanexpress.com/uk/credit-cards/platinum-card/','2026-04-22'),
('amex-plat-dining-credit-uk','American Express','American Express','Platinum','UK Dining Credit (£200/yr)','£200/yr at 160+ UK restaurants in half-year credits.','retail','ANNUALLY','2026-07-01','£100/half-year','Common','https://www.americanexpress.com/uk/credit-cards/platinum-card/','2026-04-22'),
('amex-plat-dining-credit-intl','American Express','American Express','Platinum','Intl Dining Credit (£200/yr)','£200/yr at 1,400+ international restaurants.','retail','ANNUALLY','2026-07-01','£100/half-year','Common','https://www.americanexpress.com/uk/credit-cards/platinum-card/','2026-04-22'),
('amex-plat-hotel-status','American Express','American Express','Platinum','Elite Hotel Status','Gold status at Marriott, Hilton, Radisson, Melia.','travel','ANNUALLY','2027-01-01','Ongoing','Common','https://www.americanexpress.com/uk/credit-cards/platinum-card/','2026-04-22'),
('amex-plat-eurostar-lounge','American Express','American Express','Platinum','Eurostar Lounge Access','Business Lounges in London, Brussels and Paris.','travel','NONE',null,'Unlimited personal','Occasional','https://www.americanexpress.com/uk/credit-cards/platinum-card/','2026-04-22'),
('amex-plat-times-digital','American Express','American Express','Platinum','The Times Subscription','Complimentary digital Times and Sunday Times.','retail','NONE',null,'Ongoing','Occasional','https://www.americanexpress.com/uk/credit-cards/platinum-card/','2026-04-22'),
('amex-plat-car-hire-status','American Express','American Express','Platinum','Car Hire Elite Status','Avis President''s Club and Hertz Five Star status.','travel','NONE',null,'Ongoing','Occasional','https://www.americanexpress.com/uk/credit-cards/platinum-card/','2026-04-22');
