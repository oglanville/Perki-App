/* Category → verified Unsplash CDN photo (hotlink-safe, no key, Unsplash licence).
   Per-perk override: perks.image_url wins when present. All URLs verified 2026-07-09.
   Swap any entry freely — tiles fall back to the category emoji if a URL dies. */

const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=60`;

export const CATEGORY_IMAGE = {
  Banking:      U("photo-1563013544-824ae1b704d3"),
  Protection:   U("photo-1416331108676-a22ccb276e35"),
  Savings:      U("photo-1633158829585-23ba8f7c8caf"),
  Credit:       U("photo-1613243555988-441166d4d6fd"),
  Tools:        U("photo-1426927308491-6380b6a9936f"),
  Security:     U("photo-1614064641938-3bbee52942c7"),
  Budgeting:    U("photo-1554224155-6726b3ff858f"),
  Travel:       U("photo-1488085061387-422e29b40080"),
  Investments:  U("photo-1611974789855-9c2a0a7236a3"),
  Lifestyle:    U("photo-1414235077428-338989a2e8c0"),
  Entertainment:U("photo-1489599849927-2ee91cede3ba"),
  Insurance:    U("photo-1570129477492-45c003edd2be"),
  Rewards:      U("photo-1549465220-1a8b9238cd48"),
  Family:       U("photo-1511895426328-dc8714191300"),
  Currency:     U("photo-1580519542036-c47de6196ba5"),
  Card:         U("photo-1556742049-0cfed4f6a45d"),
  Transfers:    U("photo-1556742111-a301076d9d18"),
  Wellness:     U("photo-1544367567-0f2fcb009e0b"),
  Fitness:      U("photo-1542291026-7eec264c27ff"),
  Creativity:   U("photo-1513364776144-60967b0f800f"),
  Productivity: U("photo-1497032628192-86f99bcd76bc"),
  News:         U("photo-1504711434969-e33886168f5c"),
  Workspace:    U("photo-1524758631624-e2822e304c36"),
  Education:    U("photo-1481627834876-b7833e8f5570"),
  Sports:       U("photo-1461896836934-ffe607ba8211"),
  Streaming:    U("photo-1593784991095-a205069470b6"),
  Hardware:     U("photo-1519389950473-47ba0277781c"),
  Broadband:    U("photo-1544197150-b99a580bb7a8"),
  Automotive:   U("photo-1449965408869-eaa3f722e40d"),
  Food:         U("photo-1568901346375-23c9450c58cd"),
  Shopping:     U("photo-1483985988355-763728e1935b"),
  Mobile:       U("photo-1511707171634-5f897ff02aa9"),
  Competition:  U("photo-1492684223066-81342ee5ff30"),
  Energy:       U("photo-1493612276216-ee3925520721"),
  EV:           U("photo-1449965408869-eaa3f722e40d"),
  Solar:        U("photo-1493612276216-ee3925520721"),
  Heating:      U("photo-1416331108676-a22ccb276e35"),
  "Smart Home": U("photo-1519389950473-47ba0277781c"),
};

export const categoryImage = (category) => CATEGORY_IMAGE[category] || null;
export const perkImage = (perk) => perk?.image_url || categoryImage(perk?.category);
