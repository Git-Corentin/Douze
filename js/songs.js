/* Douze — chansons fournies avec le site.
   Uniquement des chansons du domaine public (paroles et musique traditionnelles ou d'auteurs morts depuis plus de 70 ans).
   Les accords sont une harmonisation simple proposée par le site. Format : {{C}} au-dessus d'un mot, {{%C}} hors paroles. */
(function () {
  const P = (window.P = window.P || {});
  const FR = 'Traditionnel français', EN = 'Traditionnel anglophone', NO = 'Noël', MO = 'Du monde';
  P.BUILTIN = [
    { id: 'b-clair', title: 'Au clair de la lune', artist: 'Traditionnel', folder: FR, key: 0, text: `[Couplet 1]
{{C}}Au clair de la lu{{G}}ne, {{C}}mon ami {{G}}Pier{{C}}rot,
{{C}}Prête-moi ta plu{{G}}me {{C}}pour écrire {{G}}un {{C}}mot.
{{G}}Ma chandelle est {{D7}}morte, {{G}}je n'ai plus de {{D7}}feu{{G}},
{{C}}Ouvre-moi ta por{{G}}te, {{C}}pour l'amour {{G}}de {{C}}Dieu.

[Couplet 2]
{{C}}Au clair de la lu{{G}}ne, {{C}}Pierrot ré{{G}}pon{{C}}dit :
{{C}}« Je n'ai pas de plu{{G}}me, {{C}}je suis dans {{G}}mon {{C}}lit.
{{G}}Va chez la voi{{D7}}sine, {{G}}je crois qu'elle y {{D7}}est{{G}},
{{C}}Car dans sa cui{{G}}sine {{C}}on bat le {{G}}bri{{C}}quet. »` },
    { id: 'b-fontaine', title: 'À la claire fontaine', artist: 'Traditionnel', folder: FR, text: `[Couplet 1]
{{C}}À la claire fontaine, m'en allant {{G}}prome{{C}}ner,
{{C}}J'ai trouvé l'eau si belle que je m'y {{G}}suis bai{{C}}gné.

[Refrain]
{{C}}Il y a longtemps que je {{F}}t'ai{{C}}me,
Jamais je ne {{G}}t'oublie{{C}}rai.

[Couplet 2]
{{C}}Sous les feuilles d'un chêne, je me suis {{G}}fait sé{{C}}cher,
{{C}}Sur la plus haute branche, un rossi{{G}}gnol chan{{C}}tait.

[Couplet 3]
{{C}}Chante, rossignol, chante, toi qui as {{G}}le cœur {{C}}gai,
{{C}}Tu as le cœur à rire, moi je l'ai {{G}}à pleu{{C}}rer.` },
    { id: 'b-maman', title: 'Ah ! vous dirai-je, maman', artist: 'Traditionnel', folder: FR, text: `{{C}}Ah ! vous dirai-{{F}}je, ma{{C}}man,
{{F}}Ce qui {{C}}cause {{G}}mon tour{{C}}ment ?
{{C}}Papa {{F}}veut que {{C}}je rai{{G}}sonne
{{C}}Comme u{{F}}ne gran{{C}}de per{{G}}sonne ;
{{C}}Moi, je dis que {{F}}les bon{{C}}bons
{{F}}Valent {{C}}mieux que {{G}}la rai{{C}}son.` },
    { id: 'b-avignon', title: 'Sur le pont d\'Avignon', artist: 'Traditionnel', folder: FR, text: `[Refrain]
{{C}}Sur le pont d'Avi{{G}}gnon,
{{C}}On y danse, {{G}}on y danse,
{{C}}Sur le pont d'Avi{{G}}gnon,
{{C}}On y danse {{G}}tous en {{C}}rond.

[Couplet]
{{C}}Les beaux messieurs font {{G}}comme {{C}}ça,
Et puis encore {{G}}comme {{C}}ça.` },
    { id: 'b-anniv', title: 'Joyeux anniversaire', artist: 'Traditionnel', folder: FR, text: `Joyeux {{C}}anniver{{G}}saire,
Joyeux anniver{{C}}saire,
Joyeux anniver{{F}}saire, [prénom],
Joyeux {{C}}anni{{G}}ver{{C}}saire.` },
    { id: 'b-grace', title: 'Amazing Grace', artist: 'John Newton (1779)', folder: EN, text: `[Verse 1]
A{{G}}mazing grace! How {{C}}sweet the {{G}}sound,
That saved a wretch like {{D}}me!
I {{G}}once was lost, but {{C}}now am {{G}}found,
Was {{Em}}blind, but {{D}}now I {{G}}see.

[Verse 2]
'Twas {{G}}grace that taught my {{C}}heart to {{G}}fear,
And grace my fears re{{D}}lieved;
How {{G}}precious did that {{C}}grace ap{{G}}pear
The {{Em}}hour I {{D}}first be{{G}}lieved.` },
    { id: 'b-susanna', title: 'Oh! Susanna', artist: 'Stephen Foster (1848)', folder: EN, text: `[Verse]
I {{C}}come from Alabama with my banjo on my {{G}}knee,
I'm {{C}}going to Louisiana, my true love {{G}}for to {{C}}see.
It {{C}}rained all night the day I left, the weather it was {{G}}dry,
The {{C}}sun so hot I froze to death, Susanna, {{G}}don't you {{C}}cry.

[Chorus]
{{F}}Oh! Susanna, oh {{C}}don't you cry for {{G}}me,
For I {{C}}come from Alabama with my banjo {{G}}on my {{C}}knee.` },
    { id: 'b-auld', title: 'Auld Lang Syne', artist: 'Robert Burns (1788)', folder: EN, text: `[Verse]
Should {{C}}auld acquaintance {{G}}be forgot,
And {{C}}never brought to {{F}}mind?
Should {{C}}auld acquaintance {{G}}be forgot,
And {{F}}auld {{G}}lang {{C}}syne?

[Chorus]
For {{C}}auld lang {{G}}syne, my dear,
For {{C}}auld lang {{F}}syne,
We'll {{C}}take a cup o' {{G}}kindness yet,
For {{F}}auld {{G}}lang {{C}}syne.` },
    { id: 'b-saints', title: 'When the Saints Go Marching In', artist: 'Traditionnel', folder: EN, text: `Oh when the {{C}}saints go marching in,
Oh when the saints go marching {{G}}in,
Oh Lord I {{C}}want to {{C7}}be in that {{F}}number,
When the {{C}}saints go {{G}}marching {{C}}in.` },
    { id: 'b-swing', title: 'Swing Low, Sweet Chariot', artist: 'Spiritual traditionnel', folder: EN, text: `[Chorus]
{{C}}Swing low, sweet {{F}}chari{{C}}ot,
Coming for to carry me {{G}}home;
{{C}}Swing low, sweet {{F}}chari{{C}}ot,
Coming for to {{G}}carry me {{C}}home.

[Verse]
I {{C}}looked over Jordan, and {{F}}what did I {{C}}see,
Coming for to carry me {{G}}home?
A {{C}}band of angels {{F}}coming after {{C}}me,
Coming for to {{G}}carry me {{C}}home.` },
    { id: 'b-rising', title: 'House of the Rising Sun', artist: 'Traditionnel', folder: EN, text: `[Intro]
{{%Am}}  {{%C}}  {{%D}}  {{%F}}  {{%Am}}  {{%E}}  {{%Am}}  {{%E}}

[Verse 1]
There {{Am}}is a {{C}}house in {{D}}New Or{{F}}leans,
They {{Am}}call the {{C}}Rising {{E}}Sun,
And it's {{Am}}been the {{C}}ruin of {{D}}many a poor {{F}}boy,
And {{Am}}God, I {{E}}know I'm {{Am}}one.

[Verse 2]
My {{Am}}mother {{C}}was a {{D}}tai{{F}}lor,
She {{Am}}sewed my {{C}}new blue {{E}}jeans,
My {{Am}}father {{C}}was a {{D}}gamblin' {{F}}man
{{Am}}Down in {{E}}New Or{{Am}}leans.` },
    { id: 'b-scar', title: 'Scarborough Fair', artist: 'Traditionnel', folder: EN, text: `{{Am}}Are you going to {{G}}Scarborough {{Am}}Fair?
{{C}}Parsley, {{Am}}sage, rose{{D}}mary and {{Am}}thyme,
Remember {{C}}me to one who lives {{G}}there,
{{Am}}She once {{G}}was a true love of {{Am}}mine.` },
    { id: 'b-green', title: 'Greensleeves', artist: 'Traditionnel', folder: EN, text: `[Verse]
A{{Am}}las, my love, you {{G}}do me wrong
To {{F}}cast me off dis{{E}}courteously,
For {{Am}}I have loved you {{G}}well and long,
De{{F}}lighting {{E}}in your {{Am}}company.

[Chorus]
{{C}}Greensleeves was {{G}}all my joy,
{{Am}}Greensleeves was {{E}}my delight,
{{C}}Greensleeves was my {{G}}heart of gold,
And {{F}}who but my {{E}}lady {{Am}}Greensleeves.` },
    { id: 'b-clem', title: 'Oh My Darling, Clementine', artist: 'Traditionnel (1884)', folder: EN, text: `[Verse]
In a {{C}}cavern, in a canyon, excavating for a {{G7}}mine,
Dwelt a miner, forty-{{C}}niner, and his {{G7}}daughter Clemen{{C}}tine.

[Chorus]
Oh my {{C}}darling, oh my darling, oh my darling Clemen{{G7}}tine,
You are lost and gone for{{C}}ever, dreadful {{G7}}sorry, Clemen{{C}}tine.` },
    { id: 'b-bella', title: 'Bella ciao', artist: 'Traditionnel italien', folder: MO, text: `[Strofa 1]
Una mat{{Am}}tina mi son svegliato,
O bella ciao, bella ciao, bella ciao, ciao, {{A7}}ciao,
Una mat{{Dm}}tina mi son sve{{Am}}gliato
E ho tro{{E7}}vato l'inva{{Am}}sor.

[Strofa 2]
O parti{{Am}}giano, portami via,
O bella ciao, bella ciao, bella ciao, ciao, {{A7}}ciao,
O parti{{Dm}}giano, portami {{Am}}via,
Ché mi {{E7}}sento di mo{{Am}}rir.` },
    { id: 'b-silent', title: 'Silent Night', artist: 'Gruber / Mohr, trad. J. F. Young (1859)', folder: NO, text: `{{C}}Silent night, holy night,
{{G}}All is calm, {{C}}all is bright,
{{F}}Round yon Virgin {{C}}Mother and Child,
{{F}}Holy Infant so {{C}}tender and mild,
{{G}}Sleep in heavenly {{C}}peace,
Sleep in {{G}}heavenly {{C}}peace.` },
    { id: 'b-jingle', title: 'Jingle Bells', artist: 'James Pierpont (1857)', folder: NO, text: `[Verse]
{{C}}Dashing through the snow, in a one-horse open {{F}}sleigh,
{{Dm}}O'er the fields we {{G7}}go, laughing all the {{C}}way;
Bells on bobtail ring, making spirits {{F}}bright,
What {{Dm}}fun it is to {{G7}}ride and sing a sleighing song to{{C}}night.

[Chorus]
{{C}}Jingle bells, jingle bells, jingle all the way,
{{F}}Oh what fun it {{C}}is to ride in a {{D7}}one-horse open {{G7}}sleigh, hey!
{{C}}Jingle bells, jingle bells, jingle all the way,
{{F}}Oh what fun it {{C}}is to ride in a {{G7}}one-horse open {{C}}sleigh.` },
  ];
})();
