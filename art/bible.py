"""Art bible: every generated image of LEXICA is described here (Animagine XL 4.0 prompt style).

Prompt order follows the model card: subject count, character, rating, composition, style, quality.
Characters target a polished Japanese gacha splash-art look, wholesome (the players are students).
Each job yields `n` candidates; the art director keeps the best one (picks.json).
"""

QUALITY = 'masterpiece, high score, great score, absurdres'
NEG = ('lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, '
       'worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry, '
       'nsfw, sensitive, cleavage, revealing clothes, multiple views, out of frame')
NEG_SCENE = ('lowres, text, error, worst quality, low quality, low score, bad score, average score, signature, '
             'watermark, username, blurry, 1girl, 1boy, people, humans, character')
NEG_FX = NEG_SCENE + ', scenery, landscape, ground, sky'

# ------------------------------------------------------------------ heroes
# id: (subject, design tags, skin design tags). Keep each design under ~45 CLIP tokens.
HEROES = {
    # SSR
    'aurora': ('1girl', 'saint, long wavy platinum blonde hair, golden eyes, gentle smile, halo, tiara, white robe with gold trim, white angel wings, holding golden sun staff, holy light',
               'saint, long wavy lavender hair, golden eyes, gentle smile, halo, star hair ornament, navy blue festival dress with golden stars, holding golden staff, starry night'),
    'valor': ('1boy', 'young paladin, short spiky blonde hair, blue eyes, confident smile, circlet, silver and gold plate armor, blue cape, holding lance, large shield, holy light',
              'young dark knight, short silver hair, blue eyes, confident smile, black plate armor with crimson trim, purple cape, holding black lance, large black shield'),
    'inferno': ('1girl', 'petite witch, red twintails, orange eyes, smug, witch hat, black and crimson witch dress with gold trim, holding flame staff, fire magic, flames, embers',
                'petite girl, pink twintails, orange eyes, smug, white and pink yukata, holding paper fan, fireworks, summer festival, sparkles'),
    'seraph': ('1girl', 'seraph, long peach hair, orange eyes, serene, flaming halo, white and orange dress, burning wings, fire wings, holding golden spear, divine flames',
               'angel, long silver hair, orange eyes, melancholic, dark navy gothic dress, silver halo, black feathers, holding silver spear, full moon'),
    'tempest': ('1girl', 'swordswoman, teal hair, high ponytail, green eyes, determined, headband, white and green tunic, long scarf, dual wielding twin swords, wind, flying leaves',
                'swordswoman, pink hair, high ponytail, green eyes, smile, pink and white kimono, long scarf, dual wielding twin swords, cherry blossoms, falling petals'),
    'glacier': ('1girl', 'ice queen, long pale blue hair, hime cut, blue eyes, cold expression, ice crown, royal blue and white gown, cape, holding ice scepter, ice crystals, snowflakes',
                'queen, long dark purple hair, hime cut, blue eyes, elegant, black and cyan evening gown, pearl tiara, holding scepter, jellyfish, bubbles'),
    'quake': ('1girl', 'blacksmith girl, orange bob hair, amber eyes, grin, goggles on head, brown work clothes, leather apron, gloves, holding giant hammer, oversized weapon, sparks',
              'blacksmith girl, red bob hair, amber eyes, grin, goggles on head, black and orange work clothes, gloves, holding giant hammer, molten lava, embers'),
    'eclipse': ('1girl', 'princess, long black hair, purple gradient hair, red eyes, cat ears, gothic dress, black and purple, bat wings, holding crescent bow, crescent moon, dark aura',
                'princess, long orange hair, red eyes, cat ears, halloween costume, purple and orange dress, bat wings, holding bow, jack-o-lantern, candy'),
    'abyss': ('1boy', 'demon lord, long white hair, red eyes, horns, dignified, black and purple royal coat with gold trim, dark cape, holding dark orb, purple flames',
              'demon lord, long black hair, red eyes, horns, dignified, white royal coat with gold and red trim, white cape, holding glowing orb, golden flames'),
    'leviathan': ('1girl', 'dragon girl, long wavy blue hair, cyan eyes, smile, coral horns, dragon tail, white and teal armored dress, holding trident, water, splashing waves',
                  'dragon girl, long wavy pink hair, cyan eyes, smile, coral horns, dragon tail, white and pink summer dress, sun hat, holding trident, seashells, water splash'),
    # SR
    'ember': ('1girl', 'samurai girl, red hair, side ponytail, orange eyes, serious, red hair ribbon, red and black kimono, hakama, holding katana, embers, fire',
              'samurai girl, black hair, side ponytail, orange eyes, serious, navy blue yukata, holding katana, full moon, fireflies'),
    'marina': ('1girl', 'idol singer, light blue hair, double bun, blue eyes, happy, headphones, white and blue idol dress, holding microphone, music notes, bubbles',
               'idol singer, blonde hair, double bun, blue eyes, wink, pink and white idol costume, holding microphone, stage lights, sparkles'),
    'zephyr': ('1boy', 'elf archer, pointy ears, messy green hair, green eyes, calm, green ranger outfit, brown leather armor, short cape, holding bow, quiver, leaves, wind',
               'elf archer, pointy ears, messy orange hair, green eyes, calm, autumn ranger outfit, brown and orange, short cape, holding bow, maple leaves'),
    'rune': ('1girl', 'scholar girl, blonde hair, single braid, amber eyes, round glasses, beret, navy blue academic uniform with gold trim, holding large open book, glowing runes, magic circle',
             'student, brown hair, single braid, amber eyes, round glasses, magic academy uniform, red necktie, cape, holding large book, glowing runes, magic circle'),
    'onyx': ('1boy', 'tall muscular knight, short dark grey hair, amber eyes, stoic, heavy dark grey plate armor with gold trim, dark cape, holding large tower shield, standing firmly',
             'tall muscular knight, short white hair, amber eyes, stoic, white jade armor with green trim, holding white tower shield, glowing green crystals'),
    'lyric': ('1girl', 'bard, mint green hair, bob cut, teal eyes, smile, feathered hat, green and gold bard outfit, holding lute, music notes, wind',
              'bard, lavender hair, bob cut, teal eyes, smile, feathered hat, starry navy blue outfit, holding lute, music notes, stars'),
    'frost': ('1girl', 'hunter girl, short white hair, light blue eyes, sleepy, fur-trimmed hood, blue fur coat, holding crossbow, snowing, snowflakes',
              'hunter girl, short white hair, light blue eyes, sleepy, santa hat, red and white christmas coat, holding crossbow, gift box, snowing'),
    'vex': ('1girl', 'imp girl, messy pink hair, yellow eyes, mischievous grin, small horns, demon tail, small bat wings, black and pink outfit, holding pitchfork, dark magic',
            'imp girl, pastel pink hair, yellow eyes, mischievous grin, small horns, demon tail, white and pink frilly dress, holding giant lollipop, sweets, macarons'),
    # R
    'pebble': ('1boy', 'boy, child, squire, brown hair, round brown eyes, determined, cooking pot helmet, grey tunic, holding small sword, small round shield',
               'boy, child, little knight, blonde hair, round blue eyes, determined, shiny silver armor, blue cape, holding small sword, small shield'),
    'spark': ('1boy', 'boy, apprentice mage, spiky orange hair, orange eyes, cheerful grin, goggles on head, red robe, scarf, holding smoking wand, sparks',
              'boy, apprentice mage, spiky blue hair, blue eyes, cheerful grin, goggles on head, blue robe, scarf, holding wand, ice sparkles'),
    'dew': ('1girl', 'healer girl, light blue hair, bob cut, blue eyes, gentle smile, flower hair ornament, blue dress, white apron, holding wand, water droplets',
            'healer girl, pink hair, bob cut, blue eyes, gentle smile, nurse cap, pink and white dress, holding wand, cherry blossoms'),
    'sprout': ('1girl', 'druid girl, green hair, twin braids, green eyes, happy, leaf hat, leaf dress, holding sprout staff, plants, flowers',
               'farm girl, orange hair, twin braids, green eyes, happy, straw hat, autumn dress, holding basket of apples, wheat'),
    'breeze': ('1girl', 'courier girl, short yellow-green hair, green eyes, energetic, cap, blue messenger outfit, shoulder bag, letters, holding slingshot',
               'girl, short blonde hair, green eyes, energetic, sun visor, summer outfit, blue jacket, shorts, holding surfboard, beach'),
    'glimmer': ('1girl', 'nun, long blonde hair, amber eyes, gentle smile, veil, black and white nun habit, holding thick prayer book, holy light, light particles',
                'nun, long silver blue hair, amber eyes, gentle smile, veil, navy blue and gold habit, holding prayer book, starry sky, stars'),
    'shade': ('1boy', 'ninja boy, black hair, red eyes, mouth mask, black ninja outfit with purple accents, long scarf, holding daggers, shadows',
              'ninja boy, white hair, blue eyes, mouth mask, white ninja outfit with blue accents, long scarf, holding daggers, moonlight'),
    'flint': ('1boy', 'barbarian boy, spiky red hair, orange eyes, wide grin, headband, fur and leather outfit, holding axe, flames, sparks',
              'barbarian boy, spiky white hair, blue eyes, wide grin, headband, blue fur outfit, holding axe, ice, snow'),
}

# ------------------------------------------------------------------ enemies: kind -> (tags, element-free)
MONSTERS = {
    'slime': 'cute slime monster, round, jelly body, big eyes',
    'mushroom': 'mushroom monster, walking mushroom, angry eyes, spotted cap, small legs',
    'wolf': 'wolf monster, fierce wolf, fangs, glowing eyes, full body',
    'bat': 'giant bat monster, spread wings, fangs, glowing red eyes',
    'goblin': 'goblin, green skin, pointy ears, holding club, leather rags, mischievous',
    'wisp': 'will-o-wisp, floating spirit flame, ghost, glowing eyes',
    'skeleton': 'skeleton warrior, holding sword and shield, glowing eyes, armor scraps',
    'golem': 'stone golem, rock body, glowing core, massive arms',
    'harpy': 'harpy monster girl, feathered wings for arms, bird legs, talons',
    'sprite': 'small fairy sprite, glowing wings, crystal body, floating',
    'salamander': 'salamander lizard monster, standing, scales, tail',
    'armor': 'living armor, empty knight armor, glowing eyes in helmet, holding sword',
    'treant': 'treant, tree monster, bark face, branch arms, leaves',
    'gargoyle': 'gargoyle, stone demon, wings, horns, crouching',
    'mimic': 'mimic, treasure chest monster, sharp teeth, long tongue, gold coins',
    'slimeKing': 'giant king slime, golden crown, jelly body, big eyes, boss',
    'treantElder': 'ancient treant elder, giant tree monster, long moss beard, glowing eyes, boss',
    'flameDrake': 'fire dragon, drake, spread wings, flames, horns, boss',
    'frostWyrm': 'ice dragon, wyrm, crystal scales, frost breath, spread wings, boss',
    'harpyQueen': 'harpy queen, monster girl, large feathered wings, crown, talons, boss',
    'lich': 'lich, undead sorcerer, skull face, tattered robe, crown, glowing staff, boss',
    'kraken': 'kraken, giant octopus monster, many tentacles, boss',
    'colossus': 'ancient stone colossus, giant golem, glowing runes, boss',
    'demonGeneral': 'demon general, armored demon knight, horns, greatsword, bat wings, boss',
    'silentia': 'silent queen, dark sorceress, long black hair, veil over mouth, black crown, black gown, boss, villain',
}
ELEMENT_TAGS = {
    'fire': 'red and orange, fire, flames',
    'water': 'blue, water, droplets',
    'wind': 'green, wind, swirling leaves',
    'earth': 'brown and amber, rocks',
    'light': 'white and gold, holy light, glowing',
    'dark': 'black and purple, dark aura, purple flames',
}

# ------------------------------------------------------------------ backgrounds: id -> (tags, size)
WIDE, TALL = (1344, 768), (768, 1344)
SCENES = {
    'plains': ('green meadow, rolling hills, distant mountains, blue sky, white clouds, flowers, sunlight, dirt path', WIDE),
    'forest': ('enchanted forest, giant trees, glowing mushrooms, fireflies, moss, light rays, mysterious', WIDE),
    'canyon': ('volcanic canyon, lava rivers, red sky, smoke, embers, jagged rocks, glowing cracks', WIDE),
    'tundra': ('frozen tundra, ice crystals, snowfield, aurora borealis, night sky, snowing, frozen lake', WIDE),
    'sky': ('sky temple, floating islands, white marble pillars, golden light, clouds, sunset, waterfalls', WIDE),
    'graveyard': ('haunted graveyard, tombstones, dead trees, full moon, purple fog, will-o-wisps, ruined chapel', WIDE),
    'harbor': ('sunken harbor, underwater ruins, shipwreck, coral, light rays from surface, bubbles, fish', WIDE),
    'ruins': ('ancient mechanical ruins, giant brass gears, golden machinery, desert, glowing runes, dusty light', WIDE),
    'labyrinth': ('phantom labyrinth, floating stairs, purple crystals, impossible architecture, starry void, magic portals', WIDE),
    'battlefield': ('dusk battlefield, burning castle, war banners, orange sunset, smoke, broken swords, epic', WIDE),
    'citadel': ('dark citadel throne room, black stone pillars, purple flames, gothic architecture, ominous, moonlight', WIDE),
    'tower': ('inside a giant magic tower, spiral library, floating books, glowing runes, magic circles, starry ceiling', WIDE),
    'arena': ('colosseum arena, grand stadium, banners, golden sunlight, crowd stands, sand floor, epic', WIDE),
    'home': ('fantasy castle courtyard, morning sunlight, fountain, flower garden, white stone, blue sky, cherry blossoms', TALL),
    'summon': ('mystical summoning hall, giant glowing magic circle on floor, crystal pillars, starry ceiling, golden light, sacred', TALL),
    'shop': ('fantasy market street, merchant stalls, lanterns, potions, treasure, warm evening light, cozy', TALL),
    'study': ('grand magic library, tall bookshelves, floating books, warm candle light, stained glass, cozy', TALL),
    'pvp': ('night sky above colosseum, dramatic lightning, two banners, epic clouds, moonlight', TALL),
    'map': ('fantasy world map, parchment, continent, mountains, forests, sea, castles, illustrated map', (1024, 1024)),
}

# ------------------------------------------------------------------ effect textures (black background = additive)
FX = {
    'circle_holy': 'magic circle, golden, glowing, intricate runes, symmetrical, holy',
    'circle_fire': 'magic circle, red and orange, glowing, flames, intricate runes, symmetrical',
    'circle_water': 'magic circle, blue and cyan, glowing, water, intricate runes, symmetrical',
    'circle_wind': 'magic circle, green, glowing, wind, intricate runes, symmetrical',
    'circle_earth': 'magic circle, amber, glowing, intricate runes, symmetrical, stone',
    'circle_dark': 'magic circle, purple and black, glowing, intricate runes, symmetrical, demonic',
    'sigil_star': 'glowing hexagram, star sigil, white and gold light, symmetrical',
    'burst_fire': 'huge fire explosion, flames, fireball, sparks, glowing',
    'burst_ice': 'ice explosion, shattering ice crystals, frost, glowing blue',
    'burst_light': 'radiant light burst, god rays, lens flare, golden light, glowing',
    'burst_dark': 'dark energy explosion, purple lightning, black flames, glowing',
    'burst_water': 'water splash explosion, droplets, glowing blue',
    'burst_wind': 'tornado, swirling wind, green energy, leaves',
    'burst_earth': 'rock explosion, flying debris, dust, glowing cracks',
    'slash_arc': 'glowing sword slash, crescent arc, white energy trail, motion blur',
    'lightning': 'lightning bolt, electricity, branching, glowing blue white',
    'beam': 'vertical pillar of light, beam, glowing, energy column',
    'meteor': 'meteor with fiery trail, falling, glowing',
    'feather_burst': 'glowing white feathers, scattering, light particles',
    'petals': 'glowing cherry blossom petals, scattering',
}

# ------------------------------------------------------------------ chibi action poses (battle animation key poses)
# attack: the hero's own strike, aimed to the right; cast: ultimate power-up; hurt: flinch
ACTION = {
    'aurora': 'raising golden staff high, casting holy light',
    'valor': 'charging forward, thrusting lance, shield raised',
    'inferno': 'pointing flame staff forward, casting fireball',
    'seraph': 'thrusting spear forward, flames',
    'tempest': 'slashing with twin swords, leaning forward, dash',
    'glacier': 'pointing ice scepter forward, casting ice magic',
    'quake': 'swinging giant hammer overhead, jumping',
    'eclipse': 'drawing crescent bow, aiming arrow',
    'abyss': 'thrusting dark orb forward, casting dark magic',
    'leviathan': 'thrusting trident forward, water splash',
    'ember': 'slashing with katana, iaijutsu, leaning forward',
    'marina': 'singing into microphone, one arm raised, music notes',
    'zephyr': 'drawing bow, aiming arrow',
    'rune': 'holding open book forward, casting rune magic',
    'onyx': 'shield bash, pushing tower shield forward',
    'lyric': 'playing lute energetically, music notes',
    'frost': 'aiming crossbow, shooting bolt',
    'vex': 'thrusting pitchfork forward, mischievous grin',
    'pebble': 'swinging small sword, determined, jumping',
    'spark': 'waving wand, casting sparks',
    'dew': 'waving wand, casting water magic',
    'sprout': 'raising sprout staff, casting nature magic',
    'breeze': 'shooting slingshot, energetic',
    'glimmer': 'holding prayer book up, casting holy light',
    'shade': 'dashing with daggers, slashing',
    'flint': 'swinging axe overhead, roaring',
}
POSES = {
    'atk': lambda hid: f'{ACTION[hid]}, dynamic pose, action',
    'cast': lambda hid: 'power up, glowing aura, arms raised, intense',
    'hurt': lambda hid: 'hurt, flinching, eyes closed, recoiling',
}

# effect tags dropped from a design when a pose prompt must fit CLIP's 75 tokens (the pose adds its own effects)
EFFECT_WORDS = ('light', 'flame', 'fire', 'wind', 'leaves', 'snow', 'spark', 'water', 'splash', 'notes', 'bubbles',
                'rune', 'magic circle', 'ember', 'petal', 'crystal', 'aura', 'shadow', 'holy', 'moon', 'stars', 'fireworks',
                'sweets', 'macarons', 'candy', 'jellyfish', 'lava', 'ice', 'frost', 'snowing', 'divine', 'dark')
EXPRESSION_WORDS = ('smile', 'grin', 'happy', 'smug', 'determined', 'serious', 'calm', 'stoic', 'gentle', 'cold expression', 'mischievous',
                    'confident', 'energetic', 'sleepy', 'cheerful', 'dignified', 'melancholic', 'serene', 'wink', 'elegant')

# idle chibi prompts that needed a cleaner silhouette after review (no ground effects baked into the sprite)
CHIBI_DESIGN = {
    'quake': 'blacksmith girl, orange bob hair, amber eyes, grin, goggles on head, brown work clothes, leather apron, gloves, giant hammer resting on shoulder',
}
