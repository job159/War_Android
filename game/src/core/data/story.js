// Chapter intros (visual-novel scenes) and the ending. Each line: [speaker, zh, en]
// speaker: a hero id, 'boss' (the chapter boss), 'silentia' or 'narrator'. English lines are read aloud (TTS).
export const STORY = {
  1: [
    ['narrator', '翠綠平原。路標上的字一個接一個消失了。', 'The Verdant Plains. One by one, the words on the signposts are vanishing.'],
    ['rune', '契約者，你看——史萊姆把路標上的「詞」吃掉了！', 'Look, Covenanter! The slimes are eating the words off the signs!'],
    ['pebble', '沒有路標，村子裡的人就回不了家了……我、我會保護大家的！', 'Without signs, the villagers can\'t find their way home. I will protect them!'],
    ['rune', '每答對一個詞，詞靈的力量就會覺醒。我們出發吧！', 'Every word you answer correctly awakens a spirit. Let\'s go!'],
  ],
  2: [
    ['narrator', '低語森林。樹木曾經會說話，如今只剩下沙沙聲。', 'The Whispering Forest. The trees used to speak. Now they only rustle.'],
    ['sprout', '樹爺爺們都生病了……黑霧把他們的話語偷走了。', 'The old trees are sick. The black mist has stolen their words.'],
    ['zephyr', '霧的源頭在森林深處。古樹長老已經被侵蝕了。', 'The mist comes from deep in the forest. The Elder Treant has been corrupted.'],
    ['boss', '……沙……沙……離……開……', 'Leave... this... forest...'],
    ['rune', '他還在掙扎！把他喚醒吧！', 'He is still fighting it! Let\'s wake him up!'],
  ],
  3: [
    ['narrator', '熔岩峽谷。空氣熱得像在燃燒。', 'The Lava Canyon. The air itself seems to burn.'],
    ['flint', '哈！我聽說炎龍吞了一整本字典！', 'Ha! I heard the Flame Drake swallowed an entire dictionary!'],
    ['quake', '所以牠現在噴出來的火焰全是亂碼，燒得到處都是。', 'So now it breathes fire made of scrambled letters. It\'s burning everything.'],
    ['boss', '吼——！！ GRRAWR XQZ！', 'ROAR! GRRAWR XQZ!'],
    ['flint', '連吼叫都拼錯了！上吧！', 'It can\'t even spell its roar! Let\'s go!'],
  ],
  4: [
    ['narrator', '霜語冰原。極光之下，連聲音都會結冰。', 'The Frostwhisper Tundra. Under the aurora, even voices freeze.'],
    ['frost', '……好冷。我不想說話。', '...So cold. I don\'t want to talk.'],
    ['glacier', '冷靜不是沉默的藉口。霜龍凍住了整個國度的文字。', 'Being cool is no excuse for silence. The Frost Wyrm has frozen every word in my kingdom.'],
    ['rune', '只要找回正確的詞，冰就會融化！', 'If we find the right words, the ice will melt!'],
  ],
  5: [
    ['narrator', '天空神殿。浮空島嶼之間，羽毛如雪落下。', 'The Sky Temple. Between floating islands, feathers fall like snow.'],
    ['aurora', '這裡曾經是祈禱與歌聲的聖地……', 'This was once a sacred place of prayer and song.'],
    ['seraph', '我……好像來過這裡。我的記憶，就藏在這座神殿裡嗎？', 'I think I have been here before. Are my memories hidden in this temple?'],
    ['boss', '入侵者！滾出女王陛下的天空！', 'Intruders! Get out of Her Majesty\'s sky!'],
    ['aurora', '請讓開吧。我們不想傷害任何人。', 'Please step aside. We don\'t want to hurt anyone.'],
  ],
  6: [
    ['narrator', '亡語墓園。紫色的鬼火在墓碑之間遊蕩。', 'The Graveyard of Lost Words. Purple wisps drift between the tombstones.'],
    ['glimmer', '別、別怕……再微弱的光，也能照亮這裡。', 'D-don\'t be afraid. Even the faintest light can shine here.'],
    ['eclipse', '呵，墓園是夜之國的庭院。跟緊我。', 'Heh. A graveyard is the garden of the Night Kingdom. Stay close to me.'],
    ['boss', '被遺忘的詞語……都將成為我的軍隊。', 'Every forgotten word... shall join my army.'],
    ['rune', '那就讓我們把它們一個一個想起來！', 'Then let\'s remember them, one by one!'],
  ],
  7: [
    ['narrator', '沉沒港灣。曾經熱鬧的港口沉入了海底。', 'The Sunken Harbor. A busy port, now at the bottom of the sea.'],
    ['marina', '我的家鄉……大家的歌聲都被海浪吞沒了。', 'My hometown... everyone\'s songs were swallowed by the waves.'],
    ['leviathan', '深海是我的領域。克拉肯竟敢在這裡撒野！', 'The deep sea is my domain. How dare the Kraken run wild here!'],
    ['marina', '只要能再唱一次，我什麼都願意做！', 'I will do anything to sing here again!'],
  ],
  8: [
    ['narrator', '機巧遺跡。巨大的齒輪靜止不動，像在等待某個指令。', 'The Clockwork Ruins. Giant gears stand still, as if waiting for a command.'],
    ['rune', '這些符文是古代語言！啟動遺跡的口令就寫在這裡……', 'These runes are an ancient language! The command to wake the ruins is written here...'],
    ['quake', '交給我！哪個齒輪卡住了，我一鎚敲開它！', 'Leave it to me! Whatever gear is stuck, I\'ll smash it loose!'],
    ['boss', '……指令錯誤。啟動防衛模式。', 'Command error. Activating defense mode.'],
    ['rune', '糟了，是巨像！大家小心！', 'Oh no, it\'s the Colossus! Everyone, be careful!'],
  ],
  9: [
    ['narrator', '幻影迷宮。階梯漂浮在星空中，沒有上下之分。', 'The Phantom Labyrinth. Stairs float in a starry void, with no up or down.'],
    ['vex', '嘻嘻，這裡超好玩的！我把出口的路標都換過位置了～', 'Hehe, this place is so fun! I swapped all the exit signs around~'],
    ['lyric', '薇克斯！……算了，我用歌聲把正確的路唱出來吧。', 'Vex! ...Never mind. I\'ll sing us the right way out.'],
    ['rune', '迷宮的盡頭有強大的魔力。魔將就在前面。', 'There\'s powerful magic at the end of the maze. The Demon General is ahead.'],
  ],
  10: [
    ['narrator', '黃昏戰場。緘默女王的大軍與人類的最後防線對峙。', 'The Twilight Battlefield. The Silent Queen\'s army faces humanity\'s last line of defense.'],
    ['valor', '聖騎士團聽令——站在我身後！', 'Knights, hear me! Stand behind me!'],
    ['ember', '我的刀，只為守護而揮。', 'My blade is drawn only to protect.'],
    ['boss', '人類的詞語，終將歸於寂靜。', 'The words of humans will all fall silent.'],
    ['valor', '那就讓我們的聲音，大到讓你聽見！', 'Then we\'ll make our voices loud enough for you to hear!'],
  ],
  11: [
    ['narrator', '緘默城塞。這裡安靜得連心跳聲都聽得見。', 'The Silent Citadel. It is so quiet you can hear your own heartbeat.'],
    ['abyss', '哼，這座城塞的結界，是我當年被封印時的牢籠。', 'Hmph. This citadel\'s barrier was once my prison.'],
    ['eclipse', '魔王大人也會害怕回到這裡嗎？', 'Is the great Demon Lord afraid to come back here?'],
    ['abyss', '……我只是「暫時」與你們合作。別誤會了。', '...I am only working with you "for now." Don\'t get the wrong idea.'],
  ],
  12: [
    ['narrator', '巴別之塔。一切詞語的起點，也是終點。', 'The Tower of Babel. Where every word began, and where it may end.'],
    ['silentia', '契約者……為什麼要堅持說話？沉默才是永恆的和平。', 'Covenanter... why do you keep speaking? Silence is eternal peace.'],
    ['rune', '因為詞語能讓我們理解彼此！這就是我們學習的理由！', 'Because words let us understand each other! That\'s why we learn!'],
    ['aurora', '大家，把至今學會的所有詞語，都借給契約者吧！', 'Everyone, lend the Covenanter every word we have learned!'],
    ['silentia', '那就來吧。讓我聽聽，你的聲音有多強。', 'Then come. Let me hear how strong your voice truly is.'],
  ],
  ending: [
    ['narrator', '巴別之塔的頂端，第一道晨光照了進來。', 'At the top of the Tower of Babel, the first light of dawn shines in.'],
    ['silentia', '……原來，詞語是這麼溫暖的東西。', '...So words can be this warm.'],
    ['rune', '契約者，大陸的詞語都回來了！可是，還有好多字沒學完呢。', 'Covenanter, the words have returned to the land! But there are still so many left to learn.'],
    ['aurora', '學習的旅程沒有終點。我們會一直在你身邊。', 'The journey of learning never ends. We will always be by your side.'],
  ],
};

export const STORY_EXTRA_SPEAKERS = { silentia: { zh: '希蘭提亞', name: 'Silentia', enemy: 'silentia', element: 'dark' } };
