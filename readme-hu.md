# HOLOSTORAGE univerzális adat tároló réteg holochain alkalmazásokhoz

>státusz: pre-alpha

[Angol nyelvű readmy](https://github.com/utopszkij/holostorage/blob/master/readme.md) 

## 1. Áttekintés
A holochain P2P rendszer elosztott adat tároló lánca (DHT) applikációhoz kötött. Ha az applikáció kódjában bármi megváltozik, akkor az „leválik” a korábban használt DHT adat tároló láncról és új (üres) adat tárolóval működik tovább. Ez biztonsági szempontból helyes, indokolt. Viszont egy már üzembe helyezett rendszerben a program fejlesztést, hibajavítást  nagyon megnehezíti, hiszen minden módosításnál elvesznek az addig tárolt adatok.

Ezért célszerű az applikációkat két részre bontani:
- Alacsony szintű adat tároló réteg (továbbiakban HOLOSTORAGE)
- Magas szintű adat modell – megjelenítés – üzleti logika (Model – Viewer – Controller továbbiakban MVC)
Mindkét réteg egy-egy holochain DNA applikáció.
![Holostorage app struktúra](https://github.com/utopszkij/holostorage/raw/master/holostorage-app-structure.png) 

A HOLOSTORAGE réteget különösen alapos tervezés, programozás és tesztelés után szabad csak üzembe helyezni, ez a kód a továbbiakban nem módosítható (illetve módosítása az adat láncról történő lecsatlakozással jár). A magas szintű MVC réteg a „holochain bridge” -en keresztül éri el a HOLOSTORAGE réteget. Az MVC réteg módosítása nem jár a DHT láncról történő leválással.

A HOLOSTORAGE rétegben egy az adminisztrátorok által kezelhető adat táblában van tárolva, hogy melyek az „érvényes” MVC réteg „DNA.Hash” kódok, a HOLOSTORAGE csak az itt felsorolt „DNA.Hash” -es  MVC rétegekből érkező kéréseket szolgálja ki. Ezzel akadályozható meg, hogy egyes csomópontok esetleg régebbi, elavult MVC változatokat használjanak.

Mivel a holochain csomópontokon a rendszergazdák bele tudnak nézni az ott tárolt DHT adatokba, célszerű az adatokat titkosítva tárolni, hogy az illetéktelen adat-hozzáféréseket megakadályozzuk.

## 2. HOLOSTORAGE tulajdonságok
- holochain bridge -el hívható rutinok,
- hívó holochain DNA.Hash ellenőrzés (adminisztrátorok által kezelhető lista lapján),
- a HOLOSTORAGE „App.Key.Hash” -on alapuló titkosított adattárolás

## 3. HOLOSTORAGE funkciók
- rekord írás automatikus ID képzéssel,
- rekord olvasás ID alapján,
- rekord törlés ID alapján,
- rekord módosítás ID alapján,
- rekord készlet lekérés SQL szerű szintaxisban megadott lekérés alapján
- adminisztrátor funkciók (adminisztrátori jelszó ismeretében használható)
- user regisztráció
- user bejelentkezés
- rekord olvasás Key alapján

## 4. A funkció hívások szintaktikája és szemantikája
Minden funkció egy objektumot vár bemenő paraméterként, és objektumot ad vissza kimenetként.
A „record” objektum elemei csak string, number, boolean, array változók lehetnek. Function, object  típusú „property” itt nem megengedett. Minden „record” -nak kötelező eleme az 
„**id**” - rekord egyedi azonosító szám (felvitelkor automatikusan képződik) és a
„**recType**” rekord típus karakteres megnevezése.

Az alábbiakban a következő jelölést alkalmazzuk:

bemenetként várt objektum  --> visszaadott objektum 

### 4.1 Egy új rekord tárolása, automatikus „id” képzés.

**addRecord** 
	record --> {status:”OK|errorMsg”, newId:szám, key:”….”}

### 4.2 Egy meglévő rekord modosítása

**updateRecord**
	record --> {status:”OK|errorMsg”}

### 4.3 Egy meglévő rekord törlése

**deleteRecord**	
	record --> {status:”OK|errorMsg”}

### 4.4 Egy meglévő rekord elérése „id” alapján

**getRecord** 
	{recType:”...”,id:szám} --> {status:”OK|errorMsg”, record:{…}}

### 4.5 Rekord készlet elérése szűrő feltétel alapján, megadott rendezettségben, limit és kezdő sorszám használatával SQL hez (kis mértékben) hasonló lekérdező szintaxissal

**query**	
	{select:[”fieldName”,”fieldName”, ...],
	  from:”recType”,
	  where:”……..”,
	  order:[”fieldName|none”,”ASC|DESC”],
	  limit:[szám, szám]
	} --> 
	{status:”OK|errorMsg”, 
	  total:szám, 
	  records:[[value, value, ...], ...]
	}

a „select” + „from” + „where” + „order” eredményeként kapott rekord halmaz „limit[0]”-dik elemétől kezdődően „limit[1]” darab rekordot ad vissza.A "where" feltételt tartalmazó karakteres kifejezés szintaxisát lásd lentebb. 	A "limit" jelentésével kapcsolatban (lásd a myssql limitstart és limit működését is). A "total" visszaadott érték a „limit[0] és limit[1]” figyelembe vétele 	nélkül kapott 	rekordok száma.

### 4.6 Config rekord lekérdezés, modosítás

**admin**	
	{action:”set|get”, psw:”….”, config:{configRecord}} →
		 (status:”OK|errorMsg”,config:{configRecord}}  

	configRecord:

	{"id":1, "enabled":[dnaHash, dnaHash, ...], "psw":"…"}

### 4.7 User regisztráció

**regist**
	{”nick”:”...”,”psw”:”...”}  → {”satus”:”OK|errorMsg”,”id”:szám,”key”:”...”}

### 4.8 User bejelentkezés

**login**
	{”nick”:”...”,”psw”:”...”}  → {”satus”:”OK|errorMsg”,”id”:szám,”key”:”...”}

### 4.9 Rekord elérés key alapján

**getRecordByKey**
	{”key”:”….”} → {”status”:”OK|errorMsg”,”record”:{...}}
## 5. A query hívásban használható WHERE feltétel szintaxisa
EBNF szintaxis definició:

   (lásd https://hu.wikipedia.org/wiki/Backus%E2%80%93Naur-forma)
```
<expression> ::= <relation> |  NOT (expression) | <expressions>
<expressions> ::= (<expression>) [<operator> (<expression>)]+
 <relation> ::= <fieldName> <rel> <value> |  REGEXP(fieldName, <patern>)
 <rel> ::=   < | <= | = | <> | >= | >
 <value> ::= <number> | <string> | true | false | <fieldName>
 <patern> ::= ”reguláris kifejezést tartalmazó string”
 <operator> ::= AND | OR
 <number> ::= [-][<numChar>]+[.[<numChar>]+]
 <string> ::= "[<utf8Chars>]+"
    	 tarlamzhat "c" stilusú  speciális karaktereket is:  \"  \n  \r  \t
 <fieldName> ::= <alfabetChar><alfanumChar>+
	 fieldName egy record property
 	 tiltott fieldNames:  'AND' 'OR' 'REGEXP' 'true'  'false'
 <numChar> ::= 0|1|2|3|4|5|6|7|8|9
 <alfabetChar> ::= a|b|c|d.....|z|A|B|C|D...|Z|_
 <alfanumChar> ::= <alfabetChar>|<numChar>
```
**Példák helyes feltételekre:**

field1 = „valami”

(field1 = field3) AND (field2 > 25)

NOT ((field1 = „valami”) AND (field2 > 25))

(field2 <> 44) OR (REGEXP(field2,”.alam.”))

**Példák hibás feltételekre**

field1 <> valami < 10

field1 > 22 AND field3 > 4

REGEXP(field1,”abc”) OR field4 > field1

## 6. Telepítés, használat

### 6.1 HOLOSTORAGE telepítése holochain csomópontra:
```
$ cd <holochainapplikációkgyűjtőkönyvtára>                                                         
$ git clone https://github.com/utopszkij/holostorage
$ hcadmin join <holochain applikációk gyűjtő könyvtára>/holostorage holostorage
```
a hívó MVC DNA Hash konfigurálása az admin funkció segitségével.

### 6.2 Használata a hívó MVC rétegben
Holochain híd kiépítése:
```
$ hcadmin bridge <MVC chain név> holostorage <hívó zome>                              
```
Hívás formája a DNA javascript kódban:
```
param = {………..};
result = bridge(<holostorage app.DNA.Hash>, ”storage”,”functionName”, param);

A <holostorage app.DNA.Hash> értékét a 
$ hcadmin join <holochain applikációk gyűjtő könyvtára>/holostorage holostorage	parancsnál a képernyőre irja a rendszer.
Illetve a „getBridges” API hívással a javascript kódból is lekérdezhető.
```
## 7 Licensz
GNU/GPL
	






