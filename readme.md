#HOLOSTORAGE universal data storage layer for holochain applications

>status: pre-alpha

####[Hungarian readmy](https://github.com/utopszkij/holostorage/blob/master/readme-hu.md) 

##1. Overview
The holochain P2P system is bound to a distributed data storage chain (DHT) application. If anything changes in the application code, it will "disconnect" from the previously used DHT data storage chain and continue to work with a new (empty) data repository. This is safe from the point of view of security. However, in a system already installed, the program development and bug fixes are made very difficult, since any changes will cose the data stored so far be lost.

It is therefore advisable to split the applications into two parts:

- Low level data storage layer (hereinafter referred to as HOLOSTORAGE)
- High-level Data Model - Viewer – Business Controller Logic (hereinafter referred to as MVC)

![structure](https://github.com/utopszkij/holostorage/raw/master/holostorage-app-structure.png) 

Both layers are a holochain DNA application.

**The HOLOSTORAGE layer can only be put into operation after thorough planning, programming and testing. This code can no longer be modified (or branched by a disconnection from the data chain).** The high level MVC layer reaches the HOLOSTORAGE layer through the "holochain bridge". The modification of the MVC layer does not result in the DHT chain being interrupted.

In the HOLOSTORAGE layer, stored in an administrator-managed data table, the "valid" MVC layer "DNA.Hash" codes, HOLOSTORAGE serves only requests from the "DNA.Hash" MVC layers listed here. This prevents some nodes from using older obsolete MVC variants.

Since holochain nodes allow system owners to access the DHT data stored there, it is advisable to sto

##2. HOLOSTORAGE properties
- holochain bridge routines,
- calling holochain DNA.Hash check (administrator-accessible list page),
- HOLOSTORAGE is an encrypted data storage based on "App.Key.Hash"
##3. HOLOSTORAGE functions
- record writing with auto ID training,
- record reading by ID,
- record deletion by ID,
- record modification by ID,
- retrieve a set of records based on a query in SQL-like syntax
- administrator functions (can be used with administrator password)
- user registration
- user login
- record reading by Key
##4. Syntax and semantics of call functions
Each function looks like an object as an input parameter and returns an object as an output.
Properties of the "record" object are only string, number, boolean, array variables. Function, object type property is not allowed here. It is a compulsory element for every "record"
"**Id**" - record unique identifier number (generated automatically when applied) and a
"**RecType**" type of record.


The following marking is used below:

expected object as input -> return object

###4.1 Storage of a new record, automatic "id" generation.
**addRecord** 
	record --> {status:”OK|errorMsg”, newId:number,key:”….”}


###4.2 Modifying an existing record
**updateRecord**
	record --> {status:”OK|errorMsg”}



###4.3 Deleting an existing record
**deleteRecord**	
	record --> {status:”OK|errorMsg”}

###4.4 Access an existing record based on "id"
**getRecord** 
	{recType:”...”,id:number} --> {status:”OK|errorMsg”, record:{…}}

###4.5 Accessing a record set using a filter criterion, in a specified order, using a limit and starting sequence number for a query (slightly) similar to SQL query syntax
**query**
	{select:[”fieldName”,”fieldName”, ...],
	  from:”recType”,
	  where:”……..”,
	  order:[”fieldName|none”,”ASC|DESC”],
	  limit:[number, number]
	} --> 
	{status:”OK|errorMsg”, 
	  total:number, 
	  records:[[value, value, ...], ...]
	}

the record set from "select" + "from" + "where" + "order"
"Limit [0]" returns the "limit [1]" record.
See the syntax for the character expression containing the where condition.
For the "limit" report (see myssql limitstart and limit operation).
The "total" returned value was received without taking into account "limit [0] and limit [1]"
number of records.

###4.6 Config record query, modification
**admin**	
	{action:”set|get”, psw:”….”, config:{configRecord}} →
		 (status:”OK|errorMsg”,config:{configRecord}}  

```
configRecord:
	{"id":1, "enabled":[dnaHash, dnaHash, ...], "psw":"…"}
```

###4.7 User registration
**regist**
	{”nick”:”...”,”psw”:”...”}  → {”satus”:”OK|errorMsg”,”id”:number,”key”:”...”}

###4.8 User login
**login**
	{”nick”:”...”,”psw”:”...”}  → {”satus”:”OK|errorMsg”,”id”:number,”key”:”...”}

###4.9 Rekord read by  key
**getRecordByKey**
	{”key”:”….”} → {”status”:”OK|errorMsg”,”record”:{...}}

##5. The WHERE condition syntax for query calls
EBNF syntax definition:
see:
https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form

``` 
<expression> ::= <relation> |  NOT (expression) | <expressions>
<expressions> ::= (<expression>) [<operator> (<expression>)]+
 <relation> ::= <fieldName> <rel> <value> |  REGEXP(fieldName, <patern>)
 <rel> ::=   < | <= | = | <> | >= | >
 <value> ::= <number> | <string> | true | false | <fieldName>
 <patern> ::= ”string containing a regular expression”
 <operator> ::= AND | OR
 <number> ::= [-][<numChar>]+[.[<numChar>]+]
 <string> ::= "[<utf8Chars>]+"
    	 can in "c" style  spec.chars:  \"  \n  \r  \t
 <fieldName> ::= <alfabetChar><alfanumChar>+
	 fieldName is a property of record
 	 not enabled fieldNames:  'AND' 'OR' 'REGEXP' 'true'  'false'
 <numChar> ::= 0|1|2|3|4|5|6|7|8|9
 <alfabetChar> ::= a|b|c|d.....|z|A|B|C|D...|Z|_
 <alfanumChar> ::= <alfabetChar>|<numChar>
```
**examples for correct expressions:**
field1 = „anything”

(field1 = field3) AND (field2 > 25)

NOT ((field1 = „anything”) AND (field2 > 25))

(field2 <> 44) OR (REGEXP(field2,”.alam.”))

**examples for incorrect expressions:**
field1 <> anything < 10

field1 > 22 AND field3 > 4

REGEXP(field1,”abc”) OR field4 > field1

##6. Installation and use
###6.1 Install HOLOSTORAGE in a holochain node:
```
$ cd <holochain applications root>                                                         
$ git clone http://github.com/utopszkij/holostorage
$ hcadmin join <holochain applications root>/holostorage holostorage

config the MVC DNA Hash by admin function
```
###6.2 Use in caller MVC layer: 
Create holochain bridge:
$ hcadmin bridge <MVC chain name> holostorage <caller zome>                              

call format in  DNA javascript code:
```
param = {………..};
result = bridge(<holostorage app.DNA.Hash>, ”storage”,”functionName”, param);

The <holostorage app.DNA.Hash> value is  display the

$ hcadmin join <holochain applications root>/holostorage holostorage

command.

Or  get it by „getBridges” API function.
```



