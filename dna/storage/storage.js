/**
 ****************************************************************** 
 *               universal record storage object
 * 
 * store records to DHT 
 * must "id","recType" fields in all records
 * 
 * public functions (all params and result is json)
 * 
 *   addRecord		{record} --> {status, newId, key}
 *   updateRecord	{record} --> {status}
 *   deleteRecord	{record} --> {status}
 *   getRecord		{recType,id} --> {status, record}
 *   query			{select,from,where,order,limit} --> {status, total, records}
 *   getRecordByKey {key} --> {status, records}
 *   admin			{action, psw, config} --> {status,config}  
 *   regist         {nick, psw} --> {status, key}
 *   login          {nick, psw} --> {status, key}
 * 
 ****************************************************************** 
 *
 * DHT links structure
 * App.DNA.Hash
 * 	 rectypes_config
 *   rectypes_<recType1> 
 *   rectypes_<recType2>
 *  .....
 * <recType1Key>
 * 	 <recType1> (all recType1' records)
 *   <recType1>_<id> (one rectype1' record)
 * <recType2Key>
 *   ....  
 *
 */
  
/**********************
 *   system functions *
 **********************/

function genesis () {
  return true;
}

/**
 * bridge genesis  - check caller DNA
 */ 
function bridgeGenesis(side,dna,appData) {
  var config = _getConfig()	
  // config: {"id":1, "enabled":[DNAHash, ...], "psw":"...."};
  var i = 0;
  var result = false;
  if (config.enabled.length == 0) {
	result = true;
  } else {
	result = false;
	for (i=0; i < config.enabled.length; i++) {
		if (config.enabled[i] == dna) {
			result = true;
		}
	}
  }
  return result;
}

function validateCommit (entryType, entry, header, pkg, sources) { return true }
function validatePut(entry_type, entry, header, pkg, sources) { return true }
function validateLink(entryType, hash, links, package, sources) { return true }
function validateMod(entry_type,hash,newHash,pkg,sources) {return null }
function validateDel(entry_type,hash,pkg,sources) {return null }
function validatePutPkg(entry_type) {return null }
function validateModPkg(entry_type) { return null }
function validateDelPkg(entry_type) { return null }
function validateLinkPkg(entry_type) { return null }
   
 /**********************
  *  private functions *
  **********************/ 
  
 /**
  * get recTpye both record, if not exists create it
  * @param string  recTypeName
  * @return string record Hash
  */  
 function _getRecTypeKey(recType) {
	var result = '';
	var dna = App.DNA.Hash;
	var rec = {};
	var i = 0;
	var key = '';
	var key2 = '';
	var linkObj = {};
	var links = getLinks(dna, 'rectypes_'+recType, {Load:false});
    if (links instanceof Error ) {
		result = 'RECTYPE_KEY_ERROR';
	}	
	if (links.length < 1) {
		key = commit('records', _encode({"rectype":recType}));
		if (key instanceof Error ) {
			result = 'RECTYPEKEY_ERROR';
		}
		// store recType link
		linkObj = {Base:dna,Link:key,Tag:'rectypes_'+recType};
		key2 = commit("storage_links", {Links:[linkObj]});
		if (key2 instanceof Error ) {
			result = 'RECTYPEKEY_ERROR';
		}
		result = key;
	} else {
		result = links[0].Hash;
	}
    return result;
 }
 
 /** decode coded json string
  * @param string
  * @return object
  */ 
 function _decode(coded) {
    var uncoded = "";
    var chr;
    var i = 0; // pointer in coded
    var j = 0; // pointer in App.Key.hash
    while (i < coded.length) {
        uncoded += String.fromCharCode(
			parseInt(coded.substr(i,2),20) - 20 - App.Key.Hash.charCodeAt(j)
		);
		i = i + 2;
		j++;
		if (j >=  App.Key.Hash.length) {
			j = 0;
		}
    }
    return JSON.parse(uncoded);   
 }
 
 /** encode object to coded string
  * @param object
  * @return string
  */ 
 function _encode(record) {
	var uncoded = JSON.stringify(record);
	var coded = "";
	var chr;
	var i = 0; // pointer in uncoded
	var j = 0; // pointer in App.Key.Hash
	for (var i = 0; i<uncoded.length; i++) {
		chr = uncoded.charCodeAt(i);
		coded += (chr + 20 +  App.Key.Hash.charCodeAt(j)).toString(20);
		j++;
		if (j >=  App.Key.Hash.length) {
			j = 0;
		}
	 }    
	return coded;  
 }
  
 /**
  * get config data if not exists create it.
  * @return object  {id, modelDNAHash, superAdim, admins, enabled}
  */
 function _getConfig() {
	var DNAHash = '1234567890';
	var bridges = getBridges();
	if (bridges.length > 0) {
		DNAHash = bridges[0].Calle;
	} 
	var record = {"id":1, "enabled":[], "psw":"123456"};
	var dna = _getRecTypeKey('config');
	res = getRecord({"recType":"config","id":1});
    if (res.status == 'NOT_FOUND') {
		record.recType = 'config';
		addRecord(record);
		return record;
	} else {
		return res.record;
	}	
	return record; 
 }   
 
/**
 * check logical expression  
 * @param object 
 * @return bool
 * 
function _expression(record, expression) {
	var i = 1;
	var result = false;
	var operator = '';
	while (i < expression.length) {
		if (expression[i][0] == '?') {
			if (operator == '') {
				result = _expression(record, expression[i]);
			} else if (operator == '&&') {
				result = result && _expression(record, expression[i]);
			} else if (operator == '||') {
				result = result || _expression(record, expression[i]);
			}	
		} else if (expression[i][0] == '!') {
			if (operator == '') {
				result = !_expression(record, expression[i]);
			} else if (operator == '&&') {
				result = result && !_expression(record, expression[i]);
			} else if (operator == '||') {
				result = result || !_expression(record, expression[i]);
			}	
		} else {
			if (operator == '') {
				result = _relation(record, expression[i]);
			} else if (operator == '&&') {
				result = result && _relation(record, expression[i]);
			} else if (operator == '||') {
				result = result || _relation(record, expression[i]);
			}	
		}
		if (i < (expression.length - 1)) {
			operator = expression[i+1];
		}
		i = i + 2;
	}
	if (expression[0] == '!') {
		result = !result;
	}
	return result;
} 	
*/

/**
 * record to array
 * @param object record
 * @param array of fieldNames
 * @return array
 */ 
function record2Array(record,fields) {
	var result = [];
	var i = 0;
	for (i=0; i < fields.length; i++) {
		result.push(record[fields[i]]);
	}
	return result;
}

/**
 * logical expression parser object
 *
 * log expression EBNF syntax:
 *   (see https://hu.wikipedia.org/wiki/Backus%E2%80%93Naur-forma)
 * 
 * <expression> ::= <relation> | 
 *                  NOT (expression) |
 *                  (<expression>) [<operator> (<expression>)]+
 * <relation> ::= <fieldName> <rel> <value> | 
 *                REGEXP(fieldName, patern)
 * <rel> :=   < | <= | = | <> | >= | >
 * <value> := <number> | <string> | true | false | <fieldName>
 * <operator> ::= AND | OR
 * <number> ::= [-][<numChar>]+[.[<numChar>]+]
 * <string> ::= "[<utf8Chars>]+"
 *     can include "c" style spec. chars:  \"  \n  \r  \t
 * <fieldName> ::= <alfabetChar><alfanumChar>+
 *      fieldName is a property of record
 * 		not enabled fieldNames:  'AND' 'OR' 'REGEXP' 'true'  'false'
 * <numChar> ::= 0|1|2|3|4|5|6|7|8|9
 * <alfabetChar> ::= a|b|c|d.....|z|A|B|C|D...|Z|_
 * <alfanumChar> ::= <alfabetChar>|<numChar>
 *
 * use example:
 *   var parser = new Parser('(id = 1) AND (title <> "")');
 *   var result = parser.parse({"id":1,"title":"title1"});  // result: true
 *
 */ 
function Parser(expression) {
	this.tokens = [];
	this.i = 0; // tokens pointer
	this.record = {};
	this.errorMsg = '';
	this.level = 0;
	var term = '()<>!=&|,';
	var i = 0;
	var j = 0;
	var token = '';
	
	// create tokens from expression
	while (i < expression.length) {
		if (expression.substr(i,2) == '<>') {
			if (token != '') {
				this.tokens.push(token.trim());
				token = '';
			}
			this.tokens.push('<>');
			i = i + 2;	
		} else if (expression.substr(i,2) == '<=') {
			if (token != '') {
				this.tokens.push(token.trim());
				token = '';
			}
			this.tokens.push('<=');
			i = i + 2;	
		} else if (expression.substr(i,2) == '>=') {
			if (token != '') {
				this.tokens.push(token.trim());
				token = '';
			}
			this.tokens.push('>=');
			i = i + 2;	
		} else if (expression.charAt(i) == '"') {
			if (token != '') {
				this.tokens.push(token.trim());
			}
			token = '"';
			i = i + 1;
			if (i >= expression.length) {
				expression += '"';
				this.errorMsg = 'UNTERMINATED_STRING';
				i = expression.length;
			}
			while (expression.charAt(i) != '"') {
				if (expression.charAt(i) == '\\') {
					if (i < (expression.length - 1)) {
						if (expression.charAt(i+1) == '"') {
							token += '"';
						} else if (expression.charAt(i+1) == 'n') {
							token += "\n";	
						} else if (expression.charAt(i+1) == 'r') {
							token += "\r";	
						} else if (expression.charAt(i+1) == 't') {
							token += "\t";	
						} else if (expression.charAt(i+1) == '\\') {
							token += "\\";	
						} else {
							token += expression.charAt(i+1);
						}	
					} else {
						token += "\\";
						i = i + 1;
					}
					i = i + 2
				} else {
				   token += expression.charAt(i);
				   i = i + 1;
				}   
				if (i >= expression.length) {
					expression += '"';
					this.errorMsg = 'UNTERMINATED_STRING';
				}
			}	
			token += '"';
			this.tokens.push(token.trim());
			token = '';
			i = i + 1;
		} else if (term.indexOf(expression.charAt(i)) >= 0) {
			if (token != '') {
				this.tokens.push(token.trim());
				token = '';
			}
			this.tokens.push(expression.charAt(i));
			i = i + 1;
		} else {
			token += expression.charAt(i);
			i = i + 1;
		}
	} // while 
	if (token != '') {
		this.tokens.push(token.trim());
		token = '';
	}
		
	/*
	 * @return string
	 */ 
	this.getErrorMsg = function() {
		return this.errorMsg;
	}
	
	/**
	* parse relation
	* @param mixed value1
	* @param string relation type
	* @param mixed value2
	* @return bool
	*/
	this.parseRelation = function(operand1, relation, operand2) {
		var result = false;
		if (relation == '<') {
			result = (operand1 < operand2);
		} else if (relation == '<=') {
			result = (operand1 <= operand2);
		} else if (relation == '==') {
			result = (operand1 == operand2);
		} else if (relation == '!=') {
			result = (operand1 != operand2);
		} else if (relation == '>') {
			result = (operand1 > operand2);
		} else if (relation == '>=') {
			result = (operand1 >= operand2);
		} else if (relation == 'REGEXP') {
			var myReg = new RegExp(operand2);
			result = (operand1.match(myReg) != null);
		}	
		return result;
	};
	
	/**
	* parse relation and operator
	* @param bool old result
	* @param mixed value1
	* @param mixed value2
	* @param string relation type
	* @param string operation type
	* @return bool
	*/
	this.parseOperands = function(result, operand1, operand2, relation, operator) {
		var res = false;
		if (relation != '') {
			res = this.parseRelation(operand1, relation, operand2);
		} else {
			res = false;
		}	
		if (operator == '&&') {
			result = result && res;
		} else if (operator == '||') {
			result = result || res;
		} else {
			result = res;
		}
		operand1 = result;
		operand2 = null;
		relation = '';
		operator = '';
		return result;
	}
	
	/**  
	 * parse logical expression from tokens
	 * @return bool
	 */
	this.parseTokens = function() {
		var token = this.tokens[this.i];
		var result = false;
		var operator = '';
		var operand1 = null;
		var operand2 = null;
		var relation = '';
		var negate = false;
		var res = false;
		var lastTokenType = '';
		if (this.i >= this.tokens.length) {
			return result;
		}
		while (this.i < this.tokens.length) {
			token = this.tokens[this.i];
			if (token == ')') {
				this.level = this.level - 1;
				if (this.level < 0) {
					this.errorMsg = 'UNOPENED_BRACKET';
					this.i = this.tokens.length;
				}
				return result;
			} else if (token == '(') {
				this.i = this.i + 1;
				this.level = this.level + 1;
				res = this.parseTokens();
				if (this.i >= this.tokens.length) {
					this.errorMsg = 'UNFINISHED_BRACKET';
					this.i = this.tokens.length;
				}
				if (negate) {
					res = !res;
					negate = false;
				}
				if (operator == '&&') {
					result = result && res;
				} else if (operator == '||') {
					result = result || res;
				} else {
					result = res;
				} 
				operand1 = result;
				aperand2 = null;
				operator = '';
				relation = ''; 
				
				if ((lastTokenType != '(') &&
				    (lastTokenType != 'REL') &&
				    (lastTokenType != '') &&
				    (lastTokenType != 'NOT') &&
				    (lastTokenType != 'OPERATOR')) {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'OPERAND';
			} else if (token == 'NOT') {
				negate = true;
				if ((lastTokenType != '(') &&
				    (lastTokenType != '')) {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'NOT';
			} else if (token == '<') {
				relation = '<';
				if (lastTokenType != 'OPERAND') {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'REL';
			} else if (token == '<=') {
				relation = '<=';
				if (lastTokenType != 'OPERAND') {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'REL';
			} else if (token == '=') {
				relation = '==';
				if (lastTokenType != 'OPERAND') {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'REL';
			} else if (token == '<>') {
				relation = '!=';
				if (lastTokenType != 'OPERAND') {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'REL';
			} else if (token == '>') {
				relation = '>';
				lastTokenType = 'REL';
			} else if (token == '>=') {
				relation = '>=';
				if (lastTokenType != 'OPERAND') {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'REL';
			} else if (token == 'AND') {
				operator = '&&';
				if (lastTokenType != 'OPERAND') {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'OPERATOR';
			} else if (token == 'OR') {
				operator = '||';
				if (lastTokenType != 'OPERAND') {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'OPERATOR';
			} else if (token == 'REGEXP') {
				if (this.i < (this.tokens.length - 5)) {
					// this.i+1 (, +2 fieldName, +3 coma, +4 patern, +5 )
					operand1 = this.record[this.tokens[this.i + 2]];
					operand2 = this.tokens[this.i + 4];
					operand2 = operand2.substr(1, operand2.length - 2);
					this.i = this.i + 5;
					relation = 'REGEXP';
					result = this.parseOperands(result, operand1, operand2, relation, operator);
				} else {
					this.errorMsg = 'REGEXP_ERROR';
					this.i = this.tokens.length;
				}
				if ((lastTokenType != '(') &&
				    (lastTokenType != 'REL') &&
				    (lastTokenType != '') &&
				    (lastTokenType != 'OPERATOR')) {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'OPERAND';
			} else if ((isNaN(token) == false) && (token != '') & (token != ' ')) {
				if (operand1 == null) {
					operand1 = token;
				} else {
					operand2 = token;
					result = this.parseOperands(result, operand1, operand2, relation, operator);
				}
				if ((lastTokenType != '(') &&
				    (lastTokenType != 'REL') &&
				    (lastTokenType != '') &&
				    (lastTokenType != 'OPERATOR')) {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'OPERAND';
			} else if (token.charAt(0) == '"') {
				if (operand1 == null) {
					operand1 = token.substr(1, token.length-2);
				} else {
					operand2 = token.substr(1, token.length-2);
					result = this.parseOperands(result, operand1, operand2, relation, operator);
				}	
				if ((lastTokenType != '(') &&
				    (lastTokenType != 'REL') &&
				    (lastTokenType != '') &&
				    (lastTokenType != 'OPERATOR')) {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'OPERAND';
			} else if (token == 'false') {
				if (operand1 == null) {
					operand1 = false;
				} else {
					operand2 = false;
					result = this.parseOperands(result, operand1, operand2, relation, operator);
				}	
				if ((lastTokenType != '(') &&
				    (lastTokenType != 'REL') &&
				    (lastTokenType != '') &&
				    (lastTokenType != 'OPERATOR')) {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'OPERAND';
			} else if (token == 'true') {
				if (operand1 == null) {
					operand1 = true;
				} else {
					operand2 = true;
					result = this.parseOperands(result, operand1, operand2, relation, operator);
				}	
				if ((lastTokenType != '(') &&
				    (lastTokenType != 'REL') &&
				    (lastTokenType != '') &&
				    (lastTokenType != 'OPERATOR')) {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'OPERAND';
			} else if (((token >= 'a') && (token <= 'zzzzzzzzzzz')) ||
					   ((token >= 'A') && (token <= 'ZZZZZZZZZZZ'))) {
				if (operand1 == null) {
					operand1 = this.record[token];
				} else {
					operand2 = this.record[token];
					result = this.parseOperands(result, operand1, operand2, relation, operator);
				}
				if ((lastTokenType != '(') &&
				    (lastTokenType != 'REL') &&
				    (lastTokenType != '') &&
				    (lastTokenType != 'OPERATOR')) {
					this.errorMsg = 'SYNTAX_ERROR';
					this.i = this.tokens.length;
				}
				lastTokenType = 'OPERAND';
			}	
			this.i = this.i + 1;
		} // while 
		if ((result == null) && (operand1 != null)) {
			result = operand1;
		}
		if (negate) {
			result = !result;
		}
		return result;
	}; // parseTokens
	
	/**
	* parse logical expression from string
	* @param object record
	* @return bool
	*/
	this.parse = function(precord) {
		this.record = precord;
		this.i = 0; // tokens pointer
		return this.parseTokens();
	};
} // Parser object

 
 /*********************
  * public functions  *
  *********************/ 
  /** add one record	
   * {...} --> {"status":"OK|....", "newId":###, "key":"..."}
   * @param object param
   * @return object
   */ 
  function addRecord(record) {
	var maxId = 0;
	var i = 0;
	var key = '';
	var key2 = '';
	var tag = '';
	var links = [];
	var linkObj = {};

	var newRec = JSON.parse(JSON.stringify(record));
	var recType = newRec.recType;
	delete newRec.recType;
	var linkBase = _getRecTypeKey(recType);
	if (newRec.id == 0) {
		// get exists max id
		links = getLinks(linkBase, recType, {Load:true});
		if (links instanceof Error ) {
			return {"status":"ERROR_GETIDMAX", "newId":0, "key":""};
		}
		for (i=0; i<links.length; i++) {
			rec = _decode(links[i].Entry);
			if (rec.id > maxId) {
				maxId = rec.id;
			}
		}
		newRec.id = maxId + 1;
	}
	key = commit('records', _encode(newRec));
	if (key instanceof Error ) {
		return {"status":"ERROR_STORERECORD", "newId":0, "key":""};
	}
	// store recType link
	linkObj = {Base:linkBase,Link:key,Tag:recType};
    key2 = commit("storage_links", {Links:[linkObj]});
	if (key2 instanceof Error ) {
		return {"status":"ERROR_STORELINK", "newId":0, "key":""};
	}
	// store recType_id link
	tag = recType+'_'+newRec.id;
	linkObj = {Base:linkBase,Link:key,Tag:tag};
    key2 = commit("storage_links", {Links:[linkObj]});
	if (key2 instanceof Error ) {
		return {"status":"ERROR_STORELINK", "newId":0, "key":""};
	}
	return {"status":"OK", "newId":newRec.id, "key":key};
  }

  /** update one record
   * {...} --> {"status":"OK|...", "newId":###}
   * @param object param
   * @return object
   */ 
  function updateRecord(record) {
	  var result = deleteRecord(record);
	  if (result.status == 'OK') {
		result = addRecord(record);
	  }	
	  return result;
  }

  /** delete one record
   * {...} --> {"status":"OK|..."}
   * @param object record
   * @return object
   */ 
  function deleteRecord(record) {
	var recType = record.recType;
	var linkBase = _getRecTypeKey(recType);
	var key = '';
	var key2 = '';
	// get record key
    var links = getLinks(linkBase, recType+'_'+record.id, {Load:true});
    if (links instanceof Error ) {
		return {"status":"NOT_FOUND"};
	}	
	if (links.length < 1) {
		return {"status":"NOT_FOUND"};
	}
    key = links[0].Hash;
    record = _decode(links[0].Entry);
    // delete links
    key2 = commit("storage_links", {"Links":[{"Base":linkBase,"Link":key,"Tag":recType, "LinkAction":HC.LinkAction.Del}]});
	if (key2 instanceof Error ) {
		return {"status":"ERROR_DELETELINK"};
	}
    tag = recType+'_'+record.id;
    key2 = commit("storage_links", {"Links":[{"Base":linkBase,"Link":key,"Tag":tag, "LinkAction":HC.LinkAction.Del}]});
	if (key2 instanceof Error ) {
		return {"status":"ERROR_DELETELINK"};
	}
    // delete record
    key2 = remove(key,'deleted');
	if (key2 instanceof Error ) {
		return {"status":"ERROR_DELETERECORD"};
	}
    return {"status":"OK"};
  }

  /** get one record
   * {"recType":"...","id":###} --> {"status":"oOK|...", "record":{...}}
   * @param object param
   * @return object
   */ 
  function getRecord(param) {
	var recType = param.recType;
	var id = param.id;
	var linkBase = _getRecTypeKey(recType);
	// get record 
	var record = {};
    var links = getLinks(linkBase, recType+'_'+id, {Load:true});
    if (links instanceof Error ) {
		return {"status":"NOT_FOUND", "record":{}};
	}	
	if (links.length < 1) {
		return {"status":"NOT_FOUND","record":{}};
	}
	record = _decode(links[0].Entry);
	record.recType = recType;
    return {"status":"OK", "record":record};
  }

  /**
   * get one record by key
   * @param object {"key":"...."}
   * @return object
   */ 	
  function getRecordByKey(param) { 
	var key = param.key;
	var rec = get(key);
    if (rec instanceof Error ) {
		return {"status":"NOT_FOUND", "record":{}};
	}
	return {"status":"OK", "record":rec};
  }	  
 
  /**
   * query records (somewhat similar to mysql)
   * @param {
   * "select":[fieldName,...],
   * "from":"recType",
   * "where":"logical-expression see Parse object head comment!)",
   * "order":["fieldName|none","ASC|DESC"],
   * "limit":[offset, count|"all"]
   * }
   *    warning! order fieldName must in select !
   * @return object {
   *   "status":"OK|errorMsg", 
   *    total":###, 
   *   "records:[[value, value, ...], ...]
   * }
   */ 
  function query(param) {
	var select = param.select;
	var from = param.from;
	var where = param.where;
	var order = param.order;
	var limit = param.limit;
	var linkBase = _getRecTypeKey(from);
    var links = getLinks(linkBase, from, {Load:true});
	var i = 0;
	var record = {};
	var records = [];
	var orderi = 0;
	var total = 0;
	var status = 'OK';
	if (order == undefined) {
		order = ['id','ASC'];
	}
	if (limit == undefined) {
		limit = [0,'all'];
	}
	if (order[1] == undefined) {
		order[1] = 'ASC';
	}
	var parser = new Parser(where);
	for (i=0; i<links.length; i++) {
		record = _decode(links[i].Entry);
		if (parser.parse(record)) {	
			record.recType = from;
			records.push(record2Array(record,select));
			
		}
		if (parser.getErrorMsg() != '') {
			status = parser.getErrorMsg();
		}	
	}
	total = records.length;
	// sorting
	if (order[0] != 'none') {
		orderi = select.indexOf(order[0]);
		if (order[1] == 'ASC') {
			records.sort(function(a, b) {
							var result = 0;
							if (a[orderi] > b[orderi]) {
								result = 1;
							} else if  (a[orderi] < b[orderi]) {
								result = -1;
							}
							return result;
						 });	
		} else {
			records.sort(function(a, b) {
							var result = 0;
							if (a[orderi] < b[orderi]) {
								result = 1;
							} else if  (a[orderi] > b[orderi]) {
								result = -1;
							}
							return result;
						 });	
		}	
	}
	// prepare by limit	
	if (limit[0] > 0) {
		records.splice(0, limit[0]);
	}
	if (limit[1] != "all") {
		records.splice(limit[1], records.length - limit[1]);
	}
	return {"status":status, "total": total, "records":records};
  }

  /** set or get admin record
   * {"action":"set|get", "psw":"...","config":{...}} --> ("status":"OK|...","config":{...}}
   * @param object param
   * @return object {"status":"OK|errorMsg", "config":{....}}
   */ 
  function admin(param) {
	  var action = param.action;
	  var psw = param.psw;
	  var pConfig = param.config;
	  var config = _getConfig();
	  if (psw == config.psw) {
		  if (action == 'set') {
			  pConfig.recType = 'config';
			  updateRecord(pConfig);
			  return {"status":"OK","config":pConfig};
		  } else {
			  return {"status":"OK","config":config};
		  }
	  } else {
		  return {"status":"ACCESS_VIOLATION", "config":{}};
	  }
  }

  /**
   * regist one new user
   * @param object {"nick":"...", "psw":"..."}
   * @return object {"status":"OK|errorMsg", "key":...", "id".szám}
   */ 
  function regist(param) {
	  // check username is exists?
	  var where = 'nick = "'+param.nick+'"';
	  var res = query({"select":"id",
		  "from":"users",
		  "where":where,
		  "order":["none","ASC"],
		  "limit":[0,1]
	  });
	  if ((res.status == 'OK') && (res.total > 0)) {
		  return {"status":"NICK_EXISTS", "key":"", "id":0}
	  }	
 	  // store record
 	  var record = {};
 	  record.recType = 'users';
 	  record.id = 0;
 	  record.nick = param.nick;
 	  record.psw = makeHash('records',param.psw);
 	  res = addRecord(record);
	  return {"status":res.status, "key":res.key, "id":res.newId}	
  }
  
  /**
   * login user
   * @param object {"nick":"...", "psw":"..."}	
   * @return object {"status":"OK|errorMsg", "key":"...", "id":szám}
   */ 
  function login(param) {
	var linkBase = _getRecTypeKey('users');
    var links = getLinks(linkBase, 'users', {Load:true});
    var i = 0;
    var record = {};
    var result = {"status":"ACCESS_VIOLATION","key":"","id":0};
	for (i=0; i<links.length; i++) {
		record = _decode(links[i].Entry);
		if ((record.nick == param.nick) &&
		    (record.psw == makeHash('records',param.psw))
		   ) {
		   result = {"status":"OK", "key":links[i].Hash, "id":record.id};
		}    
	}
	return result;
  }
 

