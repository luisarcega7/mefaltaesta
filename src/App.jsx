import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ─── Supabase Config ───
const SUPA_URL = "https://wlpnusacbfkxrnedoyal.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndscG51c2FjYmZreHJuZWRveWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzQ1MjcsImV4cCI6MjA5MzUxMDUyN30.NdcHmnSQ9C0KFLxezOA6g-SI46hm7gps_BDJcpefT3w";
const ADMIN_EMAIL = "luis.armo7@gmail.com";

// Minimal Supabase client (no SDK needed)
const supa = {
  headers: (token) => ({
    "apikey": SUPA_KEY,
    "Authorization": `Bearer ${token || SUPA_KEY}`,
    "Content-Type": "application/json",
  }),
  async signUp(email, password) {
    const r = await fetch(`${SUPA_URL}/auth/v1/signup`, {
      method: "POST", headers: { "apikey": SUPA_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: { "apikey": SUPA_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async getUser(token) {
    const r = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${token}` },
    });
    return r.json();
  },
  async getStickers(userId, token) {
    const r = await fetch(`${SUPA_URL}/rest/v1/user_stickers?user_id=eq.${userId}&select=sticker_id,quantity`, {
      headers: supa.headers(token),
    });
    return r.json();
  },
  async syncStickers(userId, token, stickers) {
    // stickers = [{id: "MEX1", qty: 2}, ...]
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/upsert_stickers`, {
      method: "POST",
      headers: supa.headers(token),
      body: JSON.stringify({ p_user_id: userId, p_stickers: stickers }),
    });
    return r.ok;
  },
};

// ─── Sticker Data (same as before) ───
const INTRO=[{id:"00",name:"Logo Álbum",type:"foil"},{id:"FWC1",name:"Emblema Oficial",type:"foil"},{id:"FWC2",name:"Emblema Oficial",type:"foil"},{id:"FWC3",name:"Mascotas",type:"foil"},{id:"FWC4",name:"Slogan Oficial",type:"foil"},{id:"FWC5",name:"Balón Oficial",type:"foil"},{id:"FWC6",name:"Canadá Sedes",type:"foil"},{id:"FWC7",name:"México Sedes",type:"foil"},{id:"FWC8",name:"USA Sedes",type:"foil"}];
const HIST=[{id:"FWC9",name:"Italia 1934",type:"foil"},{id:"FWC10",name:"Uruguay 1950",type:"foil"},{id:"FWC11",name:"Alemania 1954",type:"foil"},{id:"FWC12",name:"Brasil 1962",type:"foil"},{id:"FWC13",name:"Alemania 1974",type:"foil"},{id:"FWC14",name:"Argentina 1986",type:"foil"},{id:"FWC15",name:"Brasil 1994",type:"foil"},{id:"FWC16",name:"Brasil 2002",type:"foil"},{id:"FWC17",name:"Italia 2006",type:"foil"},{id:"FWC18",name:"Alemania 2014",type:"foil"},{id:"FWC19",name:"Argentina 2022",type:"foil"}];

const TD=[
  {c:"MEX",n:"México",f:"🇲🇽",g:"A",cl:["#006847","#CE1126"],p:["Luis Malagón","Johan Vasquez","Jorge Sánchez","Cesar Montes","Jesus Gallardo","Israel Reyes","Diego Lainez","Carlos Rodriguez","Edson Alvarez","Orbelin Pineda","Marcel Ruiz",null,"Érick Sánchez","Hirving Lozano","Santiago Giménez","Raúl Jiménez","Alexis Vega","Roberto Alvarado","Cesar Huerta"]},
  {c:"RSA",n:"South Africa",f:"🇿🇦",g:"A",cl:["#007749","#FFB81C"],p:["Ronwen Williams","Sipho Chaine","Aubrey Modiba","Samukele Kabini","Mbekezeli Mbokazi","Khulumani Ndamane","Siyabonga Ngezana","Khuliso Mudau","Nkosinathi Sibisi","Teboho Mokoena","Thalente Mbatha",null,"Bathasi Aubaas","Yaya Sithole","Sipho Mbule","Lyle Foster","Iqraam Rayners","Mohau Nkota","Oswin Appollis"]},
  {c:"KOR",n:"South Korea",f:"🇰🇷",g:"A",cl:["#C60C30","#003478"],p:["Hyeon-woo Jo","Seung-Gyu Kim","Min-jae Kim","Yu-min Cho","Young-woo Seol","Han-beom Lee","Tae-seok Lee","Myung-jae Lee","Jae-sung Lee","In-beom Hwang","Kang-in Lee",null,"Seung-ho Paik","Jens Castrop","Dongg-yeong Lee","Gue-sung Cho","Heung-min Son","Hee-chan Hwang","Hyeon-Gyu Oh"]},
  {c:"CZE",n:"Czechia",f:"🇨🇿",g:"A",cl:["#D7141A","#11457E"],p:["Matej Kovar","Jindrich Stanek","Ladislav Krejci","Vladimir Coufal","Jaroslav Zeleny","Tomas Holes","David Zima","Michal Sadilek","Lukas Provod","Lukas Cerv","Tomas Soucek",null,"Pavel Sulc","Matej Vydra","Vasil Kusej","Tomas Chory","Vaclav Cerny","Adam Hlozek","Patrik Schick"]},
  {c:"CAN",n:"Canada",f:"🇨🇦",g:"B",cl:["#FF0000","#fff"],p:["Dayne St.Clair","Alphonso Davies","Alistair Johnston","Samuel Adekugbe","Riche Larvea","Derek Cornelius","Moïse Bombito","Kamal Miller","Stephen Eustáquio","Ismaël Koné","Jonathan Osorio",null,"Jacob Shaffelburg","Mathieu Choinière","Niko Sigur","Tajon Buchanan","Liam Millar","Cyle Larin","Jonathan David"]},
  {c:"BIH",n:"Bosnia & Herz.",f:"🇧🇦",g:"B",cl:["#002395","#FECB00"],p:["Nikola Vasilj","Amer Dedic","Sead Kolasinac","Tarik Muharemovic","Nihad Mujakic","Nikola Katic","Amir Hadziahmetovic","Benjamin Tahirovic","Armin Gigovic","Ivan Sunjic","Ivan Basic",null,"Dzenis Burnic","Esmir Bajraktarevic","Amar Memic","Ermedin Demirovic","Edin Dzeko","Samed Bazdar","Haris Tabakovic"]},
  {c:"QAT",n:"Qatar",f:"🇶🇦",g:"B",cl:["#8A1538","#fff"],p:["Meshaal Barsham","Sultan Albrake","Lucas Mendes","Homam Ahmed","Boualem Khoukhi","Pedro Miguel","Tarek Salman","Mohamed Al-Mannai","Karim Boudiaf","Assim Madibo","Ahmed Fatehi",null,"Mohammed Waad","Abdulaziz Hatem","Hassan Al-Haydos","Edmilson Junior","Akram Afif","Ahmed Al Ganehi","Almoez Ali"]},
  {c:"SUI",n:"Switzerland",f:"🇨🇭",g:"B",cl:["#D52B1E","#fff"],p:["Gregor Kobel","Yvon Mvogo","Manuel Akanji","Ricardo Rodriguez","Nico Elvedi","Aurèle Amenda","Silvan Widmer","Granit Xhaka","Denis Zakaria","Remo Freuler","Fabian Rieder",null,"Ardon Jashari","Johan Manzambi","Michel Aebischer","Breel Embolo","Ruben Vargas","Dan Ndoye","Zeki Amdouni"]},
  {c:"BRA",n:"Brazil",f:"🇧🇷",g:"C",cl:["#009c3b","#FFDF00"],p:["Alisson","Bento","Marquinhos","Éder Militão","Gabriel Magalhães","Danilo","Wesley","Lucas Paquetá","Casemiro","Bruno Guimarães","Luiz Henrique",null,"Vinicius Júnior","Rodrygo","João Pedro","Matheus Cunha","G. Martinelli","Raphinha","Estévão"]},
  {c:"MAR",n:"Morocco",f:"🇲🇦",g:"C",cl:["#C1272D","#006233"],p:["Yassine Bounou","Munir El Kajoui","Achraf Hakimi","Noussair Mazraoui","Nayef Aguerd","Roman Saiss","Jawad El Yamio","Adam Masina","Sofyan Amrabat","Azzedine Ounahi","E. Ben Seghir",null,"Bilal El Khannouss","Ismael Saibari","Youssef En-Nesyri","Abde Ezzalzouli","Soufiane Rahimi","Brahim Diaz","Ayoub El Kaabi"]},
  {c:"HAI",n:"Haiti",f:"🇭🇹",g:"C",cl:["#00209F","#D21034"],p:["Johny Placide","Carlens Arcus","Martin Expérience","J.K. Duverne","Ricardo Adé","Duke Lacroix","Garven Metusala","Hannes Delcroix","Leverton Pierre","D. Jean Jacques","J.R. Bellegarde",null,"Christopher Attys","Derrick Etienne Jr","Josue Casimir","Ruben Providence","Duckens Nazon","Louicius Deedson","Frantzdy Pierrot"]},
  {c:"SCO",n:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",g:"C",cl:["#003087","#CF142B"],p:["Angus Gunn","Jack Hendry","Kieran Tierney","Aaron Hickey","Andrew Robertson","Scott McKenna","John Souttar","Anthony Ralston","Grant Hanley","Scott McTominay","Billy Gilmour",null,"Lewis Ferguson","Ryan Christie","Kenny McLean","John McGinn","Lyndon Dykes","Che Adams","Ben Gannon-Doak"]},
  {c:"USA",n:"USA",f:"🇺🇸",g:"D",cl:["#002868","#BF0A30"],p:["Matt Freese","Chris Richards","Tim Ream","Mark McKenzie","Alex Freeman","Antonee Robinson","Tyler Adams","Tanner Tessmann","Weston McKennie","Christian Roldan","Timothy Weah",null,"Diego Luna","Malik Tillman","Christian Pulisic","Brenden Aaronson","Ricardo Pepi","Haji Wright","Folarin Balogun"]},
  {c:"PAR",n:"Paraguay",f:"🇵🇾",g:"D",cl:["#D52B1E","#0038A8"],p:["Roberto Fernandez","Orlando Gill","Gustavo Gomez","Fabián Balbuena","J.J. Cáceres","Omar Alderete","Junior Alonso","Mathías Villasanti","Diego Gomez","Damián Bobadilla","Andres Cubas",null,"Matias Galarza","Julio Enciso","A. Romero Gamarra","Miguel Almirón","Ramon Sosa","Angel Romero","Antonio Sanabria"]},
  {c:"AUS",n:"Australia",f:"🇦🇺",g:"D",cl:["#00843D","#FFCD00"],p:["Mathew Ryan","Joe Gauci","Harry Souttar","Alessandro Circati","Jordan Bos","Aziz Behich","Cameron Burgess","Lewis Miller","Milos Degenek","Jackson Irvine","Riley McGree",null,"Aiden O'Neill","Connor Metcalfe","Patrick Yazbek","Craig Goodwin","Kusini Vengi","Nestory Irankunda","Mohamed Touré"]},
  {c:"TUR",n:"Türkiye",f:"🇹🇷",g:"D",cl:["#E30A17","#fff"],p:["Ugurcan Cakir","Mert Muldur","Zeki Celik","A. Bardakci","Caglar Soyuncu","Merih Demiral","Ferdi Kadioglu","Kaan Ayhan","Ismail Yuksek","Hakan Calhanoglu","Orkun Kokcu",null,"Arda Guler","Irfan Can Kahveci","Yunus Akgun","Can Uzun","Baris A. Yilmaz","Kerem Akturkoglu","Kenan Yildiz"]},
  {c:"GER",n:"Germany",f:"🇩🇪",g:"E",cl:["#000","#DD0000"],p:["M.A. ter Stegen","Jonathan Tah","David Raum","Nico Schlotterbeck","Antonio Rüdiger","Waldemar Anton","Ridle Baku","M. Mittelstadt","Joshua Kimmich","Florian Wirtz","Felix Nmecha",null,"Leon Goretzka","Jamal Musiala","Serge Gnabry","Kai Havertz","Leroy Sane","Karim Adeyemi","Nick Woltemade"]},
  {c:"CUW",n:"Curaçao",f:"🇨🇼",g:"E",cl:["#002B7F","#F9E814"],p:["Eloy Room","Armando Obispo","Sherel Floranus","Jurien Gaari","Joshua Brenet","R. Van Eijma","Shurandy Sambo","L. Comenencia","G. Roemeratoe","Juninho Bacuna","Leandro Bacuna",null,"Tahith Chong","Kenji Gorre","Jearl Margaritha","Jurgen Locadia","J. Antonisse","G. Kastaneer","Sontje Hansen"]},
  {c:"CIV",n:"Ivory Coast",f:"🇨🇮",g:"E",cl:["#F77F00","#009E60"],p:["Yahia Fofana","Ghislain Konan","Wilfried Singo","Odilon Kossounou","Evan Ndicka","Willy Boly","E. Agbadou","O. Diomande","Franck Kessie","Seko Fofana","Ibrahim Sangare",null,"J.P. Gbamin","Amad Diallo","Sébastien Haller","Simon Adingra","Yan Diomande","Evann Guessand","Oumar Diakite"]},
  {c:"ECU",n:"Ecuador",f:"🇪🇨",g:"E",cl:["#FFD100","#002E6D"],p:["Hernán Galíndez","Gonzalo Valle","Piero Hincapié","Pervis Estupiñán","Willian Pacho","Ángelo Preciado","Joel Ordóñez","Moises Caicedo","Alan Franco","Kendry Paez","Pedro Vite",null,"John Veboah","Leonardo Campana","Gonzalo Plata","Nilson Angulo","Alan Minda","Kevin Rodriguez","Enner Valencia"]},
  {c:"NED",n:"Netherlands",f:"🇳🇱",g:"F",cl:["#FF6600","#21468B"],p:["Bart Verbruggen","Virgil van Dijk","Micky van de Ven","Jurrien Timber","Denzel Dumfries","Nathan Aké","Jeremie Frimpong","J.P. van Hecke","Tijjani Reijnders","Ryan Gravenberch","T. Koopmeiners",null,"Frenkie de Jong","Xavi Simons","Justin Kluivert","Memphis Depay","Donyell Malen","Wout Weghorst","Cody Gakpo"]},
  {c:"JPN",n:"Japan",f:"🇯🇵",g:"F",cl:["#002776","#BC002D"],p:["Zion Suzuki","Henry Mochizuki","Ayumu Seko","J. Suzuki","Shogo Taniguchi","T. Watanabe","Kaishu Sano","Yuki Soma","Ao Tanaka","Daichi Kamada","Takefusa Kubo",null,"Ritsu Doan","Keito Nakamura","Takumi Minamino","Shuto Machino","Junya Ito","Koki Ogawa","Ayase Ueda"]},
  {c:"SWE",n:"Sweden",f:"🇸🇪",g:"F",cl:["#006AA7","#FECC00"],p:["Victor Johansson","Isak Hien","G. Gudmundsson","Emil Holm","Victor Lindelöf","G. Lagerbielke","Lucas Bergvall","Hugo Larsson","Jesper Karlström","Yasin Ayari","M. Svanberg",null,"Daniel Svensson","Ken Sema","Roony Bardghji","Dejan Kulusevski","Anthony Elanga","Alexander Isak","Viktor Gyökeres"]},
  {c:"TUN",n:"Tunisia",f:"🇹🇳",g:"F",cl:["#E70013","#fff"],p:["Bechir Ben Said","Aymen Dahmen","Yan Valery","Montassar Talbi","Yassine Meriah","Ali Abdi","Dylan Bronn","Ellyes Skhiri","Aissa Laidouni","Ferjani Sassi","M.A. Ben Romdhane",null,"Hannibal Mejbri","Elias Achouri","Elias Saad","Hazem Mastouri","Ismael Gharbi","S. Ltaief","Naim Sliti"]},
  {c:"BEL",n:"Belgium",f:"🇧🇪",g:"G",cl:["#000","#EF3340"],p:["Thibaut Courtois","Arthur Theate","T. Castagne","Zeno Debast","Brandon Mechele","Maxim De Cuyper","Thomas Meunier","Youri Tielemans","Amadou Onana","Nicolas Raskin","A. Saelemaekers",null,"Hans Vanaken","Kevin De Bruyne","Jérémy Doku","C. De Ketelaere","L. Trossard","Loïs Openda","Romelu Lukaku"]},
  {c:"EGY",n:"Egypt",f:"🇪🇬",g:"G",cl:["#CE1126","#000"],p:["M. El Shenawy","Mohamed Hany","Mohamed Hamdy","Yasser Ibrahim","Khaled Sobhi","Ramy Rabia","H. Abdelmaguid","Ahmed Fatouh","Marwan Attia","Zizo","Hamdy Fathy",null,"Mohamed Lasheen","Emam Ashour","Osama Faisal","Mohamed Salah","Mostafa Mohamed","Trezeguet","Omar Marmoush"]},
  {c:"IRN",n:"Iran",f:"🇮🇷",g:"G",cl:["#239F40","#DA0000"],p:["A. Beiranvand","M. Pouraliganji","Ehsan Hajsafi","M. Mohammadi","S. Khalilzadeh","Ramin Rezaeian","Hossein Kanaani","S. Moharrami","Saleh Hardani","Saeed Ezatolahi","Saman Ghoddos",null,"Omid Noorafkan","R. Cheshmi","M. Mohebi","Sardar Azmoun","Mehdi Taremi","A. Jahanbakhsh","Ali Gholizadeh"]},
  {c:"NZL",n:"New Zealand",f:"🇳🇿",g:"G",cl:["#000","#C8102E"],p:["M. Crocombe Payne","Alex Paulsen","Michael Boxall","Liberato Cacace","Tim Payne","Tyler Bindon","Francis de Vries","Finn Surman","Joe Bell","Sarpreet Singh","Ryan Thomas",null,"Matthew Garbett","Marko Stamenić","Ben Old","Chris Wood","Elijah Just","C. McCowatt","K. Barbarouses"]},
  {c:"ESP",n:"Spain",f:"🇪🇸",g:"H",cl:["#AA151B","#F1BF00"],p:["Unai Simon","R. Le Normand","Aymeric Laporte","Dean Huijsen","Pedro Porro","Dani Carvajal","Marc Cucurella","M. Zubimendi","Rodri","Pedri","Fabian Ruiz",null,"Mikel Merino","Lamine Yamal","Dani Olmo","Nico Williams","Ferran Torres","Álvaro Morata","Mikel Oyarzabal"]},
  {c:"CPV",n:"Cape Verde",f:"🇨🇻",g:"H",cl:["#003893","#CF2027"],p:["Vozinha","Logan Costa","Pico","Diney","Steven Moreira","Wagner Pina","Joao Paulo","Yannick Semedo","Kevin Pina","Patrick Andrade","Jamiro Monteiro",null,"Deroy Duarte","Garry Rodrigues","Jovane Cabral","Ryan Mendes","D. Livramento","Willy Semedo","Bebe"]},
  {c:"KSA",n:"Saudi Arabia",f:"🇸🇦",g:"H",cl:["#006C35","#fff"],p:["Nawaf Alaqidi","A. Al-Sanbi","Saud Abdulhamid","Nawaf Bouwashl","Jihad Thakri","Moteb Al-Harbi","H. Altambakti","Musab Aljuwayr","Ziyad Aljohani","A. Alkhaibari","N. Aldawsari",null,"S. Abu Alshamat","M. Alsahafi","Salem Aldawsari","A. Al-Aboud","Feras Akbrikan","Saleh Alshehri","A. Al-Hamdan"]},
  {c:"URU",n:"Uruguay",f:"🇺🇾",g:"H",cl:["#001489","#fff"],p:["Sergio Rochet","Santiago Mele","Ronald Araujo","J.M. Giménez","S. Caceres","Mathias Olivera","G. Varela","Nahitan Nandez","F. Valverde","G. De Arrascaeta","R. Bentancur",null,"Manuel Ugarte","N. de la Cruz","Maxi Araujo","Darwin Núñez","Federico Viñas","Rodrigo Aguirre","F. Pellistri"]},
  {c:"FRA",n:"France",f:"🇫🇷",g:"I",cl:["#002395","#ED2939"],p:["Mike Maignan","Theo Hernandez","William Saliba","Jules Kounde","I. Konate","D. Upamecano","Lucas Digne","A. Tchouaméni","E. Camavinga","Manu Kone","Adrien Rabiot",null,"Michael Olise","O. Dembele","Bradley Barcola","Désiré Doué","Kingsley Coman","Hugo Ekitike","Kylian Mbappe"]},
  {c:"SEN",n:"Senegal",f:"🇸🇳",g:"I",cl:["#00853F","#E31B23"],p:["Edouard Mendy","Yehvann Diouf","M. Niakhaté","Abdoulaye Seck","Ismail Jakobs","E.H.M. Diouf","K. Koulibaly","I. Gana Gueye","Pape Matar Sarr","Pape Gueye","Habib Diarra",null,"Lamine Camara","Sadio Mane","Ismaïla Sarr","Boulaye Dia","Iliman Ndiaye","Nicolas Jackson","Krepin Diatta"]},
  {c:"IRQ",n:"Iraq",f:"🇮🇶",g:"I",cl:["#007A3D","#CE1126"],p:["Jalal Hassan","Rebin Sulaka","Hussein Ali","Akam Hashem","Merchas Doski","Zaid Tahseen","Manaf Younis","Zidane Iqbal","Amir Al-Ammari","Ibrahim Bavesh","Ali Jasim",null,"Youssef Amyn","Aimar Sher","Marko Farji","Osama Rashid","Ali Al-Hamadi","Aymen Hussein","Mohanad Ali"]},
  {c:"NOR",n:"Norway",f:"🇳🇴",g:"I",cl:["#EF2B2D","#002868"],p:["Orjan Nyland","Julian Ryerson","Leo Ostigård","K.V. Ajer","M.H. Pedersen","D.M. Wolfe","T. Heggem","Morten Thorsby","Martin Ødegaard","Sander Berge","A. Schjelderup",null,"Patrick Berg","Erling Haaland","A. Sørloth","Aron Dønnum","J. Strand Larsen","Antonio Nusa","Oscar Bobb"]},
  {c:"ARG",n:"Argentina",f:"🇦🇷",g:"J",cl:["#74ACDF","#F6B40E"],p:["E. Martinez","Nahuel Molina","Cristian Romero","N. Otamendi","N. Tagliafico","L. Balerdi","Enzo Fernandez","A. Mac Allister","Rodrigo De Paul","E. Palacios","L. Paredes",null,"Nico Paz","F. Mastantuono","Nico Gonzalez","Lionel Messi","Lautaro Martinez","Julian Alvarez","G. Simeone"]},
  {c:"ALG",n:"Algeria",f:"🇩🇿",g:"J",cl:["#006233","#D21034"],p:["A. Guendouz","R. Bensebaini","Youcef Atal","R. Aït-Nouri","M.A. Tougai","Aïssa Mandi","I. Bennacer","Houssem Aquar","H. Boudaoui","Ramiz Zerrouki","Nabil Bentalab",null,"Farés Chaibi","Riyad Mahrez","Said Benrahma","A. Hadj Moussa","Amine Gouiri","B. Bounedjah","M. Amoura"]},
  {c:"AUT",n:"Austria",f:"🇦🇹",g:"J",cl:["#ED2939","#fff"],p:["A. Schlager","Patrick Pentz","David Alaba","Kevin Danso","P. Lienhart","Stefan Posch","P. Mwene","Alexander Prass","Xaver Schlager","Marcel Sabitzer","Konrad Laimer",null,"F. Grillitsch","Nicolas Seiwald","Romano Schmid","Patrick Wimmer","C. Baumgartner","M. Gregoritsch","M. Arnautović"]},
  {c:"JOR",n:"Jordan",f:"🇯🇴",g:"J",cl:["#007A3D","#CE1126"],p:["Y. Abulaila","Ihsan Haddad","M. Abu Hashish","Yazan Al-Arab","A. Nasib","Saleem Obaid","M. Abualnadi","I. Saadeh","N. Al-Rashdan","N. Al-Rawabdeh","M. Abu Taha",null,"Amer Jamous","M. Al-Taamari","Y. Al-Naimat","M. Al-Mardi","Ali Olwan","M. Abu Zrayq","Ibrahim Sabra"]},
  {c:"POR",n:"Portugal",f:"🇵🇹",g:"K",cl:["#006600","#FF0000"],p:["Diogo Costa","Jose Sa","Ruben Dias","João Cancelo","Diogo Dalot","Nuno Mendes","Gonçalo Inácio","Bernardo Silva","Bruno Fernandes","Ruben Neves","Vitinha",null,"João Neves","Cristiano Ronaldo","F. Trincao","João Felix","Gonçalo Ramos","Pedro Neto","Rafael Leão"]},
  {c:"COD",n:"Congo DR",f:"🇨🇩",g:"K",cl:["#007FFF","#CE1021"],p:["Lionel Mpasi","A. Wan-Bissaka","Axel Tuanzebe","A. Masuaku","Chancel Mbemba","Joris Kayembe","Charles Pickel","N. Mukau","Edo Kayembe","S. Moutoussamy","Noah Sadiki",null,"T. Bongonda","Meschak Elia","Yoane Wissa","Brian Cipenga","Fiston Mayele","C. Bakambu","N. Mbuku"]},
  {c:"UZB",n:"Uzbekistan",f:"🇺🇿",g:"K",cl:["#0099B5","#1EB53A"],p:["Utkir Yusupov","F. Savfiev","S. Nasrullaev","U. Eshmurodov","H. Aliqulov","R. Ashurmatov","K. Alijonov","A. Khusanov","O. Hamrobekov","O. Shukurov","J. Iskanderov",null,"A. Turgunboev","K. Erkinov","E. Shomurodov","Oston Urunov","J. Masharipov","Igor Sergeev","A. Fayzullaev"]},
  {c:"COL",n:"Colombia",f:"🇨🇴",g:"K",cl:["#FCD116","#003893"],p:["Camilo Vargas","David Ospina","D. Sánchez","Yerry Mina","Daniel Munoz","Johan Mojica","Jhon Lucumí","Santiago Arias","Jefferson Lerma","Kevin Castaño","Richard Rios",null,"James Rodriguez","J.F. Quintero","Jorge Carrascal","Jhon Arias","Jhon Córdoba","Luis Suárez","Luis Díaz"]},
  {c:"ENG",n:"England",f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",g:"L",cl:["#CF142B","#002366"],p:["Jordan Pickford","John Stones","Marc Guéhi","Ezri Konsa","T. Alexander-Arnold","Reece James","Dan Burn","J. Henderson","Declan Rice","Jude Bellingham","Cole Palmer",null,"Morgan Rogers","Anthony Gordon","Phil Foden","Bukayo Saka","Harry Kane","M. Rashford","Ollie Watkins"]},
  {c:"CRO",n:"Croatia",f:"🇭🇷",g:"L",cl:["#FF0000","#171796"],p:["D. Livaković","Duje Caleta-Car","Josko Gvardiol","Josip Stanišić","Luka Vušković","Josip Sutalo","Kristijan Jakic","Luka Modrić","Mateo Kovacic","Martin Baturina","Lovro Majer",null,"Mario Pasalic","Petar Sucic","Ivan Perišić","Marco Pasalic","Ante Budimir","A. Kramarić","Franjo Ivanovic"]},
  {c:"GHA",n:"Ghana",f:"🇬🇭",g:"L",cl:["#006B3F","#FCD116"],p:["L. Ati Zigi","Tariq Lamptey","M. Salisu","Alidu Seidu","Alexander Djiku","Gideon Mensah","Caleb Yirenkyi","A.I. Fatawu","Thomas Partey","S. Abdul Samed","K. Sulemana",null,"M. Kudus","Inaki Williams","Jordan Ayew","Andrew Ayew","Joseph Paintsil","Osman Bukari","A. Semenyo"]},
  {c:"PAN",n:"Panama",f:"🇵🇦",g:"L",cl:["#DA121A","#003DA5"],p:["O. Mosquera","Luis Mejia","Fidel Escobar","Andres Andrade","M.A. Murillo","Eric Davis","Jose Cordoba","Cesar Blackman","Cristian Martinez","Aníbal Godoy","A. Carrasquilla",null,"É. Bárcenas","Carlos Harvey","Ismael Díaz","Jose Fajardo","C. Waterman","J.L. Rodriguez","A. Quintero"]},
];

function genS(t){const s=[];s.push({id:`${t.c}1`,name:"Team Logo",type:"foil",num:1});t.p.forEach((p,i)=>{const n=i+2;s.push(p===null?{id:`${t.c}${n}`,name:"Team Photo",type:"photo",num:n}:{id:`${t.c}${n}`,name:p,type:"player",num:n});});return s;}
const TEAMS=TD.map(t=>({...t,stickers:genS(t)}));
const TOTAL=980;
const GROUPS=["A","B","C","D","E","F","G","H","I","J","K","L"];

export default function App(){
  // ─── Auth State ───
  const[user,setUser]=useState(null);
  const[token,setToken]=useState(null);
  const[authView,setAuthView]=useState("login"); // login | signup
  const[authEmail,setAuthEmail]=useState("");
  const[authPass,setAuthPass]=useState("");
  const[authErr,setAuthErr]=useState("");
  const[authLoading,setAuthLoading]=useState(false);
  const[initialLoading,setInitialLoading]=useState(true);

  // ─── App State ───
  const[col,setCol]=useState({});
  const[view,setView]=useState("home");
  const[sg,setSg]=useState(null);
  const[st,setSt]=useState(null);
  const[q,setQ]=useState("");
  const[pg,setPg]=useState("L");
  const[fl,setFl]=useState(null);
  const[syncing,setSyncing]=useState(false);
  const[lastSync,setLastSync]=useState(null);
  const syncTimer=useRef(null);
  const[totalGlobal,setTotalGlobal]=useState(0);
  const[adminData,setAdminData]=useState(null);

  // ─── Donation tips (random rotation) ───
  const TIPS=[
    {emoji:"☕",label:"Si te gustó doname pa un",link:"https://mpago.la/1ibN2zK"},
    {emoji:"🍺",label:"Si te gustó doname pa una",link:"https://mpago.la/2GLeU72"},
    {emoji:"🌮",label:"Si te gustó doname pa unos",link:"https://mpago.la/1r4gTSc"},
  ];
  const[tipIdx,setTipIdx]=useState(()=>Math.floor(Math.random()*3));
  useEffect(()=>{const iv=setInterval(()=>setTipIdx(p=>(p+1)%3),15000);return()=>clearInterval(iv);},[]);
  const tip=TIPS[tipIdx];

  // ─── Colors ───
  const X={bg:"#0c1220",sf:"#141e30",cd:"#1a2540",pr:"#e8364f",gn:"#34d399",gd:"#f0c040",tx:"#e2e8f0",dm:"#94a3b8",bd:"#1e293b"};

  // ─── Auto-login from stored token ───
  useEffect(()=>{
    const stored=localStorage.getItem("mfa-auth");
    if(stored){
      try{
        const{access_token}=JSON.parse(stored);
        supa.getUser(access_token).then(u=>{
          if(u.id){setUser(u);setToken(access_token);loadStickers(u.id,access_token);}
          else{localStorage.removeItem("mfa-auth");}
          setInitialLoading(false);
        }).catch(()=>{localStorage.removeItem("mfa-auth");setInitialLoading(false);});
      }catch{localStorage.removeItem("mfa-auth");setInitialLoading(false);}
    }else{setInitialLoading(false);}
  },[]);

  // ─── Fetch global sticker count ───
  useEffect(()=>{
    fetch(`${SUPA_URL}/rest/v1/rpc/get_global_sticker_count`,{method:"POST",headers:{"apikey":SUPA_KEY,"Content-Type":"application/json"}})
      .then(r=>r.json()).then(n=>{if(typeof n==="number")setTotalGlobal(n);}).catch(()=>{});
  },[lastSync]);

  // ─── Admin data fetch ───
  const isAdmin=user&&user.email===ADMIN_EMAIL;
  const isAdminRoute=window.location.pathname.replace(/\/$/,"")==="/luigiadmin";
  useEffect(()=>{
    if(isAdmin&&isAdminRoute&&token){
      Promise.all([
        fetch(`${SUPA_URL}/rest/v1/rpc/admin_stats`,{method:"POST",headers:supa.headers(token)}).then(r=>r.json()),
        fetch(`${SUPA_URL}/rest/v1/rpc/admin_most_missing`,{method:"POST",headers:supa.headers(token)}).then(r=>r.json()),
      ]).then(([stats,missing])=>setAdminData({stats:Array.isArray(stats)?stats[0]:stats,missing})).catch(e=>console.error("Admin fetch:",e));
    }
  },[isAdmin,token]);

  // ─── Google Analytics helper ───
  const gtag=(...args)=>{if(window.gtag)window.gtag(...args);};
  const trackEvent=(action,category,label)=>gtag("event",action,{event_category:category,event_label:label});

  // ─── Generate Story Image ───
  const[genImg,setGenImg]=useState(false);
  const generateStoryImage=async()=>{
    try{
    setGenImg(true);
    trackEvent("click","share","generate_story_image");
    
    if(!window.html2canvas){
      alert("html2canvas no cargó. Intenta recargar la página.");
      setGenImg(false);
      return;
    }
    
    alert("Paso 1: inicio");
    
    // Gather missing stickers
    const missing=[];
    const introMiss=INTRO.filter(s=>!col[s.id]).map(s=>s.id);
    const histMiss=HIST.filter(s=>!col[s.id]).map(s=>s.id);
    if(introMiss.length>0)missing.push({flag:"⚽",code:"INTRO",nums:introMiss});
    if(histMiss.length>0)missing.push({flag:"🏆",code:"HIST",nums:histMiss});
    TEAMS.forEach(t=>{
      const m=t.stickers.filter(s=>!col[s.id]||col[s.id]===0).map(s=>s.num);
      if(m.length>0)missing.push({flag:t.f,code:t.c,nums:m});
    });
    
    // Gather dupes
    const repes=[];
    TEAMS.forEach(t=>{
      const d=t.stickers.filter(s=>(col[s.id]||0)>1).map(s=>({num:s.num,qty:col[s.id]}));
      if(d.length>0)repes.push({flag:t.f,code:t.c,items:d});
    });

    alert("Paso 2: data lista. Missing="+missing.length+" Repes="+repes.length);

    // Build the hidden div
    const W=1080;
    const el=document.createElement("div");
    el.style.cssText=`position:fixed;left:-9999px;top:0;width:${W}px;font-family:'DM Sans','Segoe UI',system-ui,sans-serif;background:linear-gradient(180deg,#0c1220 0%,#111827 100%);color:#e2e8f0;padding:0;`;
    
    // Helper to build country row HTML
    const rowHTML=(items,isDupe)=>items.map(t=>{
      const nums=isDupe
        ?t.items.map(d=>`<span style="display:inline-block;background:rgba(240,192,64,0.15);border:1px solid rgba(240,192,64,0.3);border-radius:4px;padding:2px 6px;font-size:20px;font-weight:700;color:#f0c040;margin:2px;">${d.num}<span style="font-size:14px;opacity:0.7">×${d.qty}</span></span>`).join("")
        :t.nums.map(n=>`<span style="display:inline-block;background:rgba(232,54,79,0.12);border:1px solid rgba(232,54,79,0.25);border-radius:4px;padding:2px 6px;font-size:20px;font-weight:700;color:#e8364f;margin:2px;">${n}</span>`).join("");
      return`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <span style="font-size:28px;flex-shrink:0;">${t.flag}</span>
        <span style="font-size:22px;font-weight:800;color:#fff;min-width:65px;letter-spacing:0.5px;">${t.code}</span>
        <div style="display:flex;flex-wrap:wrap;gap:3px;flex:1;">${nums}</div>
      </div>`;
    }).join("");

    el.innerHTML=`
      <div style="padding:60px 50px 40px;">
        <!-- Header -->
        <div style="text-align:center;margin-bottom:40px;">
          <div style="font-size:56px;font-weight:900;text-transform:uppercase;letter-spacing:-1px;color:#fff;line-height:1;">Me Falta Esta</div>
          <div style="font-size:20px;color:rgba(255,255,255,0.4);letter-spacing:6px;text-transform:uppercase;margin-top:6px;">Mundial 2026</div>
          <div style="margin-top:20px;display:flex;justify-content:center;gap:40px;">
            <div style="text-align:center;"><div style="font-size:42px;font-weight:800;color:#34d399;">${owned}</div><div style="font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Tengo</div></div>
            <div style="text-align:center;"><div style="font-size:42px;font-weight:800;color:#e8364f;">${miss}</div><div style="font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Faltan</div></div>
            <div style="text-align:center;"><div style="font-size:42px;font-weight:800;color:#f0c040;">${dupes}</div><div style="font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Repes</div></div>
            <div style="text-align:center;"><div style="font-size:42px;font-weight:800;color:#fff;">${pct}%</div><div style="font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Avance</div></div>
          </div>
          <!-- Progress bar -->
          <div style="margin-top:16px;height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#e8364f,#f0c040);border-radius:4px;"></div>
          </div>
        </div>

        ${missing.length>0?`
        <!-- Missing Section -->
        <div style="margin-bottom:36px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="height:1px;flex:1;background:linear-gradient(90deg,transparent,rgba(232,54,79,0.4));"></div>
            <div style="font-size:22px;font-weight:800;text-transform:uppercase;letter-spacing:3px;color:#e8364f;">❌ Me Faltan</div>
            <div style="height:1px;flex:1;background:linear-gradient(90deg,rgba(232,54,79,0.4),transparent);"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 30px;">
            ${(()=>{
              const half=Math.ceil(missing.length/2);
              const col1=missing.slice(0,half);
              const col2=missing.slice(half);
              return`<div>${rowHTML(col1,false)}</div><div>${rowHTML(col2,false)}</div>`;
            })()}
          </div>
        </div>
        `:""}

        ${repes.length>0?`
        <!-- Repes Section -->
        <div style="margin-bottom:36px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="height:1px;flex:1;background:linear-gradient(90deg,transparent,rgba(240,192,64,0.4));"></div>
            <div style="font-size:22px;font-weight:800;text-transform:uppercase;letter-spacing:3px;color:#f0c040;">🔄 Repetidas</div>
            <div style="height:1px;flex:1;background:linear-gradient(90deg,rgba(240,192,64,0.4),transparent);"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 30px;">
            ${(()=>{
              const half=Math.ceil(repes.length/2);
              const col1=repes.slice(0,half);
              const col2=repes.slice(half);
              return`<div>${rowHTML(col1,true)}</div><div>${rowHTML(col2,true)}</div>`;
            })()}
          </div>
        </div>
        `:""}

        <!-- Footer branding -->
        <div style="text-align:center;padding-top:30px;border-top:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:18px;font-weight:700;color:rgba(240,192,64,0.5);letter-spacing:4px;text-transform:uppercase;">mefaltaesta.com</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.2);margin-top:6px;">Registra tus estampas gratis</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(el);
    
    try{
      await new Promise(r=>setTimeout(r,100));
      alert("Paso 3: DOM listo, llamando html2canvas");
      
      const canvas=await window.html2canvas(el,{
        scale:1,
        useCORS:true,
        backgroundColor:"#0c1220",
        width:W,
        windowWidth:W,
      });
      
      alert("Paso 4: canvas generado "+canvas.width+"x"+canvas.height);
      
      document.body.removeChild(el);
      
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
      alert("Paso 5: blob="+(blob?blob.size+" bytes":"NULL"));
      if(!blob){setGenImg(false);return;}
      
      const file=new File([blob],"me-falta-esta.png",{type:"image/png"});
      const canShare=navigator.canShare&&navigator.canShare({files:[file]});
      alert("Paso 6: canShare="+canShare);
      if(canShare){
        try{
          await navigator.share({files:[file],title:"Me Falta Esta",text:"Mi lista del álbum del Mundial 2026 🏆⚽"});
        }catch(e){if(e.name!=="AbortError")console.error("Share error:",e);}
      }else{
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        a.href=url;a.download="me-falta-esta.png";a.click();
        URL.revokeObjectURL(url);
      }
    }catch(e){
      alert("Error: "+e.message);
      console.error("Image generation error:",e);
      try{document.body.removeChild(el);}catch(_){}
    }
    setGenImg(false);
    }catch(outerErr){alert("Outer error: "+outerErr.message);setGenImg(false);}
  };

  // ─── Load stickers from Supabase ───
  const loadStickers=async(uid,tok)=>{
    try{
      const data=await supa.getStickers(uid,tok);
      if(Array.isArray(data)){
        const c={};
        data.forEach(r=>{if(r.quantity>0)c[r.sticker_id]=r.quantity;});
        setCol(c);
      }
    }catch(e){console.error("Load stickers error:",e);}
  };

  // ─── Debounced sync to Supabase ───
  const scheduleSync=useCallback((newCol)=>{
    if(syncTimer.current)clearTimeout(syncTimer.current);
    syncTimer.current=setTimeout(async()=>{
      if(!user||!token)return;
      setSyncing(true);
      try{
        const stickers=Object.entries(newCol).map(([id,qty])=>({id,qty}));
        if(stickers.length>0){
          await supa.syncStickers(user.id,token,stickers);
          setLastSync(new Date());
        }
      }catch(e){console.error("Sync error:",e);}
      setSyncing(false);
    },2000); // 2 second debounce
  },[user,token]);

  // ─── Auth handlers ───
  const handleAuth=async(isSignup)=>{
    setAuthErr("");setAuthLoading(true);
    try{
      const res=isSignup?await supa.signUp(authEmail,authPass):await supa.signIn(authEmail,authPass);
      if(res.error){setAuthErr(res.error.message||res.error_description||"Error");setAuthLoading(false);return;}
      if(res.access_token){
        localStorage.setItem("mfa-auth",JSON.stringify(res));
        setToken(res.access_token);
        const u=await supa.getUser(res.access_token);
        setUser(u);
        await loadStickers(u.id,res.access_token);
        trackEvent(isSignup?"sign_up":"login","auth",authEmail);
      }else if(isSignup){
        setAuthErr("Revisa tu email para confirmar tu cuenta.");
      }
    }catch(e){setAuthErr("Error de conexión");}
    setAuthLoading(false);
  };

  const logout=()=>{
    setUser(null);setToken(null);setCol({});
    localStorage.removeItem("mfa-auth");
    setView("home");
  };

  // ─── Collection modifiers (with sync) ───
  const owned=useMemo(()=>Object.keys(col).filter(k=>col[k]>0).length,[col]);
  const miss=TOTAL-owned;
  const pct=Math.round((owned/TOTAL)*100);
  const dupes=useMemo(()=>Object.values(col).reduce((s,v)=>s+Math.max(0,v-1),0),[col]);

  const updateCol=(newCol)=>{setCol(newCol);scheduleSync(newCol);};

  const tog=(id)=>{
    const v=col[id]||0;
    if(!v){setFl(id);setTimeout(()=>setFl(null),300);}
    const nc={...col,[id]:v?0:1};
    updateCol(nc);
  };
  const addD=(id,e)=>{e.stopPropagation();const nc={...col,[id]:(col[id]||0)+1};updateCol(nc);};
  const subD=(id,e)=>{e.stopPropagation();const v=col[id]||0;if(v<=1)return;const nc={...col,[id]:v-1};updateCol(nc);};
  const tp=(c)=>{const t=TEAMS.find(x=>x.c===c);if(!t)return{o:0};return{o:t.stickers.filter(s=>(col[s.id]||0)>0).length};};

  // ─── Sticker Cell ───
  const SC=({s,tc})=>{
    const qty=col[s.id]||0,has=qty>0,ifl=fl===s.id,fo=s.type==="foil",ph=s.type==="photo";
    const parts=s.name.split(" "),last=parts.pop(),first=parts.join(" ");
    return(
      <div onClick={()=>tog(s.id)} style={{
        background:has?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)",borderRadius:5,
        border:has?(fo?"2px solid #f0c040":`2px solid ${X.gn}`):"1.5px dashed rgba(255,255,255,0.18)",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        cursor:"pointer",position:"relative",padding:"6px 2px 4px",
        aspectRatio:"3/4",transition:"all 0.15s",
        transform:ifl?"scale(1.08)":"scale(1)",
        boxShadow:ifl?`0 0 14px ${fo?"rgba(240,192,64,0.5)":"rgba(52,211,153,0.4)"}`:"none",
        overflow:"hidden",minWidth:0,
      }}>
        {has&&<div style={{position:"absolute",top:2,right:2,fontSize:8,color:X.gn,fontWeight:800}}>✓</div>}
        <div style={{fontSize:8,fontWeight:800,color:has?(fo?X.gd:"rgba(255,255,255,0.85)"):"rgba(255,255,255,0.2)",letterSpacing:0.3,marginBottom:1}}>
          {tc} {s.num}
        </div>
        {!has&&<div style={{fontSize:16,opacity:0.08,fontWeight:900,lineHeight:1,color:"#fff"}}>26</div>}
        {has&&fo&&<div style={{fontSize:12}}>✦</div>}
        {has&&ph&&<div style={{fontSize:12}}>📷</div>}
        {has&&!fo&&!ph&&<div style={{fontSize:12}}>⚽</div>}
        <div style={{textAlign:"center",marginTop:1,lineHeight:1.1,maxWidth:"100%",padding:"0 1px"}}>
          {(fo||ph)?<div style={{fontSize:6.5,fontWeight:600,color:has?X.tx:"rgba(255,255,255,0.18)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
          :<>
            <div style={{fontSize:5.5,color:has?"rgba(255,255,255,0.45)":"rgba(255,255,255,0.12)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{first||"\u00A0"}</div>
            <div style={{fontSize:7,fontWeight:800,color:has?X.tx:"rgba(255,255,255,0.18)",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{last}</div>
          </>}
        </div>
        {has&&<div style={{display:"flex",alignItems:"center",gap:2,marginTop:2}}>
          <button onClick={e=>subD(s.id,e)} style={{width:15,height:15,borderRadius:3,border:"none",background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:10,cursor:"pointer",fontWeight:800,padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
          <span style={{fontSize:7,fontWeight:800,color:X.gd,minWidth:10,textAlign:"center"}}>×{qty}</span>
          <button onClick={e=>addD(s.id,e)} style={{width:15,height:15,borderRadius:3,border:"none",background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:10,cursor:"pointer",fontWeight:800,padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        </div>}
      </div>
    );
  };

  // ─── Album Double Page (4x3 grid) ───
  const AlbumView=({team})=>{
    const s=team.stickers,pr=tp(team.c),done=pr.o===20,[c1,c2]=team.cl,gT=TEAMS.filter(x=>x.g===team.g);

    const leftPg=(
      <div style={{background:`linear-gradient(160deg,${c1}dd,${c1}99 55%,${c2}66)`,borderRadius:"10px 3px 3px 10px",padding:"10px 7px 8px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"45%",left:"50%",transform:"translate(-50%,-50%)",fontSize:160,fontWeight:900,opacity:0.05,color:"#fff",pointerEvents:"none"}}>26</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
          <div style={{gridColumn:"span 2",display:"flex",flexDirection:"column",justifyContent:"center",padding:"4px 2px",position:"relative",zIndex:1}}>
            <div style={{fontSize:9,fontWeight:800,color:"rgba(255,255,255,0.55)",letterSpacing:3}}>WE ARE</div>
            <div style={{fontSize:18,fontWeight:900,color:"#fff",textTransform:"uppercase",lineHeight:1.1,letterSpacing:-0.5}}>{team.n}</div>
            <div style={{fontSize:18,marginTop:3}}>{team.f}</div>
          </div>
          <SC s={s[0]} tc={team.c}/><SC s={s[1]} tc={team.c}/>
          {s.slice(2,6).map(x=><SC key={x.id} s={x} tc={team.c}/>)}
          {s.slice(6,10).map(x=><SC key={x.id} s={x} tc={team.c}/>)}
        </div>
        <div style={{marginTop:8,borderTop:"1px solid rgba(255,255,255,0.12)",paddingTop:4}}>
          <div style={{fontSize:6,color:"rgba(255,255,255,0.25)",letterSpacing:1,textTransform:"uppercase"}}>Camino al Mundial 2026</div>
        </div>
      </div>
    );

    const rightPg=(
      <div style={{background:`linear-gradient(200deg,${c2}dd,${c1}77 60%,${c2}88)`,borderRadius:"3px 10px 10px 3px",padding:"10px 7px 8px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"45%",left:"50%",transform:"translate(-50%,-50%)",fontSize:160,fontWeight:900,opacity:0.05,color:"#fff",pointerEvents:"none"}}>26</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
          <div/>
          <SC s={s[10]} tc={team.c}/><SC s={s[11]} tc={team.c}/><SC s={s[12]} tc={team.c}/>
          {s.slice(13,17).map(x=><SC key={x.id} s={x} tc={team.c}/>)}
          <div/>
          {s.slice(17,20).map(x=><SC key={x.id} s={x} tc={team.c}/>)}
        </div>
        <div style={{marginTop:8,borderTop:"1px solid rgba(255,255,255,0.12)",paddingTop:5}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{background:"rgba(255,255,255,0.15)",borderRadius:3,padding:"2px 7px",fontSize:9,fontWeight:800,color:"#fff"}}>GROUP {team.g}</div>
            <div style={{display:"flex",gap:2}}>{gT.map(x=><span key={x.c} style={{fontSize:13}}>{x.f}</span>)}</div>
          </div>
        </div>
      </div>
    );

    return(
      <div>
        <div style={{padding:"8px 10px",display:"flex",alignItems:"center",gap:8,background:X.sf}}>
          <div style={{flex:1,height:5,borderRadius:3,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${(pr.o/20)*100}%`,borderRadius:3,background:done?X.gn:`linear-gradient(90deg,${X.pr},${X.gd})`,transition:"width 0.4s"}}/>
          </div>
          <span style={{fontSize:12,fontWeight:800,color:done?X.gn:X.tx}}>{pr.o}/20{done&&" ✓"}</span>
        </div>
        <div style={{display:"flex",background:X.sf,borderBottom:`1px solid ${X.bd}`}}>
          {["L","R"].map(p=>(
            <button key={p} onClick={()=>setPg(p)} style={{
              flex:1,padding:"7px 0",border:"none",cursor:"pointer",fontSize:10,fontWeight:700,
              background:pg===p?"rgba(255,255,255,0.06)":"transparent",
              color:pg===p?"#fff":X.dm,borderBottom:pg===p?`2px solid ${X.pr}`:"2px solid transparent",letterSpacing:0.5,
            }}>{p==="L"?"◀ PÁG. IZQUIERDA":"PÁG. DERECHA ▶"}</button>
          ))}
        </div>
        <div style={{padding:6}}>{pg==="L"?leftPg:rightPg}</div>
      </div>
    );
  };

  // ─── Header ───
  const Hdr=({t,back,onBack})=>(
    <div style={{background:`linear-gradient(180deg,${X.pr},#a01030)`,padding:"10px 14px",position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
      {back&&<button onClick={onBack} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:28,height:28,borderRadius:7,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>←</button>}
      <div style={{flex:1,minWidth:0}}>
        <h1 style={{fontSize:16,fontWeight:800,color:"#fff",margin:0,textTransform:"uppercase",letterSpacing:-0.3,lineHeight:1.1}}>{t}</h1>
        <div className="hdr-sub" style={{fontSize:8,color:"rgba(255,255,255,0.55)",marginTop:1,letterSpacing:2,textTransform:"uppercase"}}>Mundial 2026</div>
      </div>
      {user&&<div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
        {syncing&&<div style={{width:6,height:6,borderRadius:3,background:X.gd,animation:"pulse 1s infinite"}}/>}
        <button onClick={()=>{trackEvent("click","donation",tip.emoji);window.open(tip.link,"_blank");}} style={{background:X.gd,border:"none",color:"#000",fontSize:9,padding:"6px 10px",borderRadius:8,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",gap:4,transition:"all 0.3s",whiteSpace:"nowrap",lineHeight:1.2,textAlign:"left"}}>
          {tip.label} <span style={{fontSize:16}}>{tip.emoji}</span>
        </button>
        <button onClick={logout} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:9,padding:"3px 6px",borderRadius:4,cursor:"pointer",fontWeight:600}}>Salir</button>
      </div>}
    </div>
  );

  const MB=({v,m})=>{const p=Math.round((v/m)*100);return(<div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:55,height:4,borderRadius:2,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,borderRadius:2,background:p===100?X.gn:X.pr,transition:"width 0.3s"}}/></div><span style={{fontSize:10,color:X.dm,fontWeight:600}}>{v}/{m}</span></div>);};

  // ─── AUTH SCREEN ───
  if(initialLoading){
    return(<div style={{background:X.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:X.tx,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>⚽</div><div style={{fontSize:14,color:X.dm}}>Cargando...</div></div>
    </div>);
  }

  if(!user){
    return(
      <div style={{background:X.bg,minHeight:"100vh",color:X.tx,fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{width:"100%",maxWidth:360}}>
          <div style={{textAlign:"center",marginBottom:30}}>
            <div style={{fontSize:48,marginBottom:8}}>⚽</div>
            <h1 style={{fontSize:22,fontWeight:900,margin:0,textTransform:"uppercase",letterSpacing:-0.5}}>Me Falta Esta</h1>
            <p style={{color:X.dm,fontSize:12,marginTop:4,letterSpacing:2,textTransform:"uppercase"}}>Mi Álbum del Mundial 2026</p>
          </div>

          <div style={{background:X.sf,borderRadius:12,padding:20,border:`1px solid ${X.bd}`}}>
            <div style={{display:"flex",marginBottom:16,borderRadius:8,overflow:"hidden",border:`1px solid ${X.bd}`}}>
              {["login","signup"].map(v=>(
                <button key={v} onClick={()=>{setAuthView(v);setAuthErr("");}} style={{
                  flex:1,padding:"8px 0",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,
                  background:authView===v?"rgba(255,255,255,0.08)":"transparent",
                  color:authView===v?"#fff":X.dm,
                }}>{v==="login"?"Iniciar Sesión":"Crear Cuenta"}</button>
              ))}
            </div>

            <input value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="Email"
              type="email" style={{width:"100%",padding:"10px 12px",background:X.cd,border:`1px solid ${X.bd}`,borderRadius:8,color:X.tx,fontSize:14,outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
            <input value={authPass} onChange={e=>setAuthPass(e.target.value)} placeholder="Contraseña (mín. 6 caracteres)"
              type="password" style={{width:"100%",padding:"10px 12px",background:X.cd,border:`1px solid ${X.bd}`,borderRadius:8,color:X.tx,fontSize:14,outline:"none",marginBottom:12,boxSizing:"border-box"}}
              onKeyDown={e=>{if(e.key==="Enter")handleAuth(authView==="signup");}}/>

            {authErr&&<div style={{background:"rgba(232,54,79,0.12)",border:"1px solid rgba(232,54,79,0.3)",borderRadius:6,padding:"8px 10px",marginBottom:12,fontSize:12,color:X.pr}}>{authErr}</div>}

            <button onClick={()=>handleAuth(authView==="signup")} disabled={authLoading}
              style={{width:"100%",padding:"12px",background:X.pr,border:"none",borderRadius:8,color:"#fff",fontSize:14,fontWeight:700,cursor:authLoading?"wait":"pointer",opacity:authLoading?0.7:1}}>
              {authLoading?"...":(authView==="login"?"Entrar":"Crear Cuenta")}
            </button>
          </div>

          <div style={{textAlign:"center",marginTop:16,fontSize:11,color:X.dm}}>
            Tus estampas se guardan en la nube. Accede desde cualquier dispositivo.
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN APP (authenticated) ───
  const vHome=()=>(
    <div>
      <Hdr t="Me Falta Esta"/>
      <div style={{display:"flex",justifyContent:"space-around",padding:"10px",background:X.sf,borderBottom:`1px solid ${X.bd}`}}>
        {[{v:owned,l:"Tengo",c:X.gn},{v:miss,l:"Faltan",c:X.pr},{v:dupes,l:"Repes",c:X.gd},{v:`${pct}%`,l:"Avance",c:"#fff"}].map(x=>(<div key={x.l} style={{textAlign:"center"}}><div style={{fontSize:17,fontWeight:800,color:x.c}}>{x.v}</div><div style={{fontSize:8,color:X.dm,textTransform:"uppercase",letterSpacing:1,marginTop:1}}>{x.l}</div></div>))}
      </div>
      {totalGlobal>0&&<div style={{background:"rgba(240,192,64,0.08)",padding:"6px 12px",textAlign:"center",fontSize:11,color:X.gd,fontWeight:600,borderBottom:`1px solid ${X.bd}`}}>
        ⚽ {totalGlobal.toLocaleString("en-US")} cartitas registradas al momento
      </div>}
      <div style={{height:3,background:X.bd,margin:"0 12px",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${X.pr},${X.gd})`,borderRadius:2,transition:"width 0.5s"}}/></div>
      <div style={{padding:"8px 12px 0"}}>
        <button onClick={generateStoryImage} disabled={genImg} style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,rgba(232,54,79,0.12),rgba(240,192,64,0.12))",border:"1px solid rgba(240,192,64,0.2)",borderRadius:8,color:X.tx,fontSize:12,fontWeight:700,cursor:genImg?"wait":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:genImg?0.6:1}}>
          {genImg?"⏳ Generando...":"📸 Compartir mi lista"}
        </button>
      </div>
      <div style={{padding:"12px 12px 6px"}}>
        <div style={{fontSize:10,fontWeight:700,color:X.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Introducción</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3,marginBottom:10}}>{INTRO.map(s=><SC key={s.id} s={{...s,num:s.id}} tc=""/>)}</div>
        <div style={{fontSize:10,fontWeight:700,color:X.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Historia del Mundial</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3}}>{HIST.map(s=><SC key={s.id} s={{...s,num:s.id}} tc=""/>)}</div>
      </div>
      <div style={{padding:"4px 12px 12px"}}>
        <div style={{fontSize:10,fontWeight:700,color:X.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Grupos</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
          {GROUPS.map(g=>{const gt=TEAMS.filter(x=>x.g===g),go=gt.reduce((s,t)=>s+tp(t.c).o,0),gm=gt.length*20,gp=Math.round((go/gm)*100);
            return(<div key={g} onClick={()=>{setSg(g);setView("grp")}} style={{background:X.cd,borderRadius:9,padding:"10px",cursor:"pointer",border:`1px solid ${X.bd}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <span style={{fontSize:13,fontWeight:800}}>Grupo {g}</span>
                <span style={{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:3,background:gp===100?"rgba(52,211,153,0.12)":"rgba(232,54,79,0.1)",color:gp===100?X.gn:X.pr}}>{gp}%</span>
              </div>
              <div style={{display:"flex",gap:2,fontSize:14,marginBottom:5}}>{gt.map(t=><span key={t.c}>{t.f}</span>)}</div>
              <MB v={go} m={gm}/>
            </div>);
          })}
        </div>
      </div>
      {/* Donate banner */}
      <div style={{margin:"8px 12px 16px",padding:"12px 14px",background:"linear-gradient(135deg,rgba(240,192,64,0.12),rgba(232,54,79,0.08))",borderRadius:10,border:"1px solid rgba(240,192,64,0.2)"}}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>¿Te gusta la app? {tip.emoji}</div>
        <div style={{fontSize:10,color:X.dm,marginBottom:8}}>Esta app es gratis. Si te sirve, una donación ayuda a mantenerla.</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {TIPS.map((t,i)=>(
            <button key={i} onClick={()=>{trackEvent("click","donation_banner",t.emoji);window.open(t.link,"_blank");}} style={{flex:1,minWidth:80,background:i===tipIdx?X.gd:"rgba(255,255,255,0.08)",border:"none",borderRadius:6,padding:"8px 6px",fontSize:10,fontWeight:700,color:i===tipIdx?"#000":X.tx,cursor:"pointer",transition:"all 0.3s",lineHeight:1.3}}>
              {t.label} {t.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const vGrp=()=>{const gt=TEAMS.filter(x=>x.g===sg);return(<div><Hdr t={`Grupo ${sg}`} back onBack={()=>setView("home")}/>
    {gt.map(t=>{const p=tp(t.c);return(<div key={t.c} onClick={()=>{setSt(t);setPg("L");setView("team")}} style={{display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:`1px solid ${X.bd}`,cursor:"pointer"}}>
      <span style={{fontSize:24,marginRight:10}}>{t.f}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{t.n}</div><MB v={p.o} m={20}/></div><span style={{color:X.dm,fontSize:12}}>›</span>
    </div>);})}</div>);};

  const vTeam=()=>(<div><Hdr t={st.n} back onBack={()=>setView("grp")}/><AlbumView team={st}/></div>);

  const vMiss=()=>{const m=[];INTRO.forEach(s=>{if(!col[s.id])m.push({...s,tf:"⚽"});});HIST.forEach(s=>{if(!col[s.id])m.push({...s,tf:"🏆"});});
    TEAMS.forEach(t=>t.stickers.forEach(s=>{if(!col[s.id]||col[s.id]===0)m.push({...s,tn:t.n,tf:t.f});}));

    const shareWhatsApp=()=>{
      trackEvent("click","whatsapp_share","faltantes");
      const lines=m.slice(0,50).map(s=>`${s.id} - ${s.name}`);
      const msg=`Me faltan ${m.length} estampas del álbum del Mundial 2026:\n\n${lines.join("\n")}${m.length>50?`\n...y ${m.length-50} más`:""}\n\nRegistra las tuyas en mefaltaesta.com`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank");
    };

    return(<div><Hdr t={`Faltan ${miss}`}/>
      <div style={{padding:"8px 12px"}}>
        {m.length>0&&<button onClick={shareWhatsApp} style={{width:"100%",padding:"10px",background:"#25D366",border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          📱 Compartir faltantes por WhatsApp
        </button>}
        {m.length===0?<div style={{textAlign:"center",padding:40,color:X.gn,fontSize:16,fontWeight:800}}>¡Álbum Completo! 🎉🏆</div>
        :m.map(s=>(<div key={s.id} onClick={()=>tog(s.id)} style={{display:"flex",alignItems:"center",padding:"6px 8px",background:X.cd,borderRadius:4,gap:6,marginBottom:2,cursor:"pointer"}}>
          <span style={{fontSize:9,fontWeight:700,color:X.pr,minWidth:42}}>{s.id}</span><span style={{fontSize:11,flex:1}}>{s.name}</span><span style={{fontSize:12}}>{s.tf}</span></div>))}
      </div></div>);
  };

  const vDup=()=>{const d=[];TEAMS.forEach(t=>t.stickers.forEach(s=>{const q=col[s.id]||0;if(q>1)d.push({...s,qty:q,tf:t.f,tn:t.n});}));
    const shareRepesWA=()=>{
      trackEvent("click","whatsapp_share","repetidas");
      const lines=d.slice(0,50).map(s=>`${s.id} - ${s.name} (×${s.qty})`);
      const msg=`🔄 Estas son mis repetidas del Mundial 2026:\n\n${lines.join("\n")}${d.length>50?`\n...y ${d.length-50} más`:""}\n\nRegistra las tuyas en mefaltaesta.com`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank");
    };
    return(<div><Hdr t={`Repetidas (${dupes})`}/><div style={{padding:"8px 12px"}}>
      {d.length>0&&<button onClick={shareRepesWA} style={{width:"100%",padding:"10px",background:"#25D366",border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        📱 Compartir repetidas por WhatsApp
      </button>}
      {d.length===0?<div style={{textAlign:"center",padding:40,color:X.dm,fontSize:12}}>No tienes repetidas aún</div>
    :d.map(s=>(<div key={s.id} style={{display:"flex",alignItems:"center",padding:"6px 8px",background:X.cd,borderRadius:4,gap:6,marginBottom:2}}>
      <span style={{fontSize:9,fontWeight:700,color:X.gd,minWidth:42}}>{s.id}</span><span style={{fontSize:11,flex:1}}>{s.name}</span><span style={{fontSize:12}}>{s.tf}</span>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <button onClick={e=>subD(s.id,e)} style={{width:18,height:18,borderRadius:3,border:"none",background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:12,cursor:"pointer",fontWeight:800}}>−</button>
        <span style={{fontSize:11,fontWeight:700,color:X.gd}}>×{s.qty}</span>
        <button onClick={e=>addD(s.id,e)} style={{width:18,height:18,borderRadius:3,border:"none",background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:12,cursor:"pointer",fontWeight:800}}>+</button>
      </div></div>))}</div></div>);};

  // ─── Admin Panel (/luigiadmin) ───
  const vAdmin=()=>{
    if(!isAdmin)return <div style={{padding:40,textAlign:"center",color:X.pr}}>No autorizado</div>;
    if(!adminData)return <div style={{padding:40,textAlign:"center",color:X.dm}}>Cargando...</div>;
    const s=adminData.stats||{};
    return(
      <div>
        <Hdr t="Admin Panel"/>
        <div style={{padding:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[
              {l:"Usuarios",v:s.total_users||0,c:X.gn},
              {l:"Cartitas Registradas",v:(s.total_stickers||0).toLocaleString("en-US"),c:X.gd},
              {l:"Promedio por Usuario",v:s.avg_per_user?Math.round(s.avg_per_user):0,c:"#fff"},
              {l:"Usuarios Hoy",v:s.users_today||0,c:X.pr},
            ].map(x=>(
              <div key={x.l} style={{background:X.cd,borderRadius:8,padding:12,border:`1px solid ${X.bd}`}}>
                <div style={{fontSize:20,fontWeight:800,color:x.c}}>{x.v}</div>
                <div style={{fontSize:9,color:X.dm,textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{x.l}</div>
              </div>
            ))}
          </div>
          <div style={{background:X.cd,borderRadius:8,padding:12,border:`1px solid ${X.bd}`}}>
            <div style={{fontSize:11,fontWeight:700,color:X.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Top Estampas Más Faltantes</div>
            {(adminData.missing||[]).slice(0,15).map((m,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${X.bd}`,gap:8}}>
                <span style={{fontSize:10,fontWeight:800,color:X.pr,minWidth:30}}>{i+1}.</span>
                <span style={{fontSize:11,flex:1}}>{m.sticker_id}</span>
                <span style={{fontSize:10,color:X.dm}}>{m.missing_count} usuarios</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:10,background:"rgba(240,192,64,0.08)",borderRadius:8,border:`1px solid ${X.bd}`}}>
            <div style={{fontSize:10,color:X.dm}}>📊 Para ver clicks en donaciones y tráfico detallado, revisa <a href="https://analytics.google.com" target="_blank" rel="noopener" style={{color:X.gd}}>Google Analytics</a></div>
          </div>
        </div>
      </div>
    );
  };

  const vSrch=()=>{const res=q.length>=2?(()=>{const ql=q.toLowerCase(),r=[];TEAMS.forEach(t=>t.stickers.forEach(s=>{if(s.name.toLowerCase().includes(ql)||s.id.toLowerCase().includes(ql))r.push({...s,tn:t.n,tf:t.f});}));return r.slice(0,30);})():[];
    return(<div><Hdr t="Buscar"/><div style={{padding:"8px 12px"}}><div style={{position:"relative"}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:14,color:X.dm}}>🔍</span>
      <input value={q} onChange={e=>setQ(e.target.value)} autoFocus placeholder="Nombre o número..." style={{width:"100%",padding:"9px 8px 9px 32px",background:X.cd,border:`1px solid ${X.bd}`,borderRadius:7,color:X.tx,fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
      {q.length>=2&&<div style={{marginTop:8}}><div style={{fontSize:10,color:X.dm,marginBottom:5}}>{res.length} resultado{res.length!==1?"s":""}</div>
        {res.map(s=>{const has=(col[s.id]||0)>0;return(<div key={s.id} onClick={()=>tog(s.id)} style={{display:"flex",alignItems:"center",padding:"7px 8px",background:has?"rgba(52,211,153,0.06)":X.cd,borderRadius:4,gap:6,marginBottom:2,cursor:"pointer",border:has?"1px solid rgba(52,211,153,0.2)":`1px solid ${X.bd}`}}>
          <span style={{fontSize:9,fontWeight:700,color:has?X.gn:X.dm,minWidth:42}}>{s.id}</span><div style={{flex:1}}><div style={{fontSize:11,fontWeight:600}}>{s.name}</div><div style={{fontSize:9,color:X.dm}}>{s.tf} {s.tn}</div></div>{has&&<span style={{color:X.gn,fontSize:12}}>✓</span>}</div>);})}</div>}
    </div></div>);};

  // ─── Admin route check ───
  if(isAdminRoute&&user){
    return(
      <div style={{background:X.bg,minHeight:"100vh",color:X.tx,fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",maxWidth:480,margin:"0 auto"}}>
        {vAdmin()}
      </div>
    );
  }

  return(
    <div style={{background:X.bg,minHeight:"100vh",color:X.tx,fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",maxWidth:480,margin:"0 auto",paddingBottom:68}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} @media(max-width:480px){.hdr-sub{display:none!important;}}`}</style>
      {view==="home"&&vHome()}{view==="grp"&&vGrp()}{view==="team"&&vTeam()}{view==="missing"&&vMiss()}{view==="dupes"&&vDup()}{view==="search"&&vSrch()}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,display:"flex",background:X.sf,borderTop:`1px solid ${X.bd}`,zIndex:100}}>
        {[{id:"home",i:"📖",l:"Álbum"},{id:"missing",i:"❌",l:"Faltan"},{id:"dupes",i:"🔄",l:"Repes"},{id:"search",i:"🔍",l:"Buscar"}].map(tab=>(
          <button key={tab.id} onClick={()=>setView(tab.id)} style={{flex:1,padding:"7px 0 5px",border:"none",background:"none",color:view===tab.id?X.pr:X.dm,fontSize:8,fontWeight:600,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,textTransform:"uppercase",letterSpacing:0.5}}>
            <span style={{fontSize:16}}>{tab.i}</span>{tab.l}
          </button>
        ))}
      </div>
    </div>
  );
}
