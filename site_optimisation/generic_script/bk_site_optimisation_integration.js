/*
####################################################################
### ORACLE BLUEKAI : Site Optimisation : JSON Return integration ###
####################################################################

Author : roshan.gonsalkorale@oracle.com, alex.wilton@oracle.com, mike.knott@oracle.com

Notes:

- This will query BlueKai for visitor profile data (campaign IDs and Category IDs) and send to a third party site optimisation platform
	- Supported Services:
		- DFP - via GPT syntax https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_setTargeting)
- The code aims to dispatch BlueKai profile data to the third party system by either finding it via the BlueKai API or using a local storage copy
- It aims to call the third party system as quickly as possible
- All code is asynchronous

Debugger:
	
- add 'bk_so_logger=true' as a query-string parameter in the URL and check the console logs

Implementation Instructions:

- Third party specific instructions:
	- DFP - DFP to be implemented via Google Publisher Tag (https://developers.google.com/doubleclick-gpt/)
- Update the config as per the "CONFIG" section below (please reach out to Oracle for help if required)

Code Workflow:

- If visitor profile data hasn't already been returned:
	- it will check for it in local storage and send it also call BlueKai again for the data
- If visitor profile data has been returned:
	- it will parse that
- Whenever BlueKai profile data is found:
	- it will store it for reference in localstorage
	- it will call send the data to the third party system
	- If the data has already been send to the third party system, it won't do it again
- Use the debugging to check the workflow

*/

// CONFIG : EDIT THIS PART

// Create object to store functions
window.bk_so_integration = window.bk_so_integration || {};
window.bk_so_integration.functions = window.bk_so_integration.functions || {};
window.bk_so_integration.data = window.bk_so_integration.data || {};
window.bk_so_integration.bluekai_jsonreturn_id = "46544"; // replace with your JSON Return Container ID
window.bk_so_integration.wait_in_ms = 5000; // How long to wait before asking BlueKai for the latest categories and firing data to third party (default 5000ms)

/* 
##########################################################################################
DO NOT EDIT BELOW THIS LINE
##########################################################################################
*/

// Create Objects for target party systems 

/*
##########################################################################################
THIRD PARTY SPECIFIC CODE
##########################################################################################
------------------------------------------------------------------------------------------
DFP SPECIFIC CODE
------------------------------------------------------------------------------------------

// !!! WARNING !!! Ensure that this runs before your existing GPT code and that this won't conflict with your existing 'googletag' object
*/



/*
##########################################################################################
END OF THIRD PARTY SPECIFIC CODE
##########################################################################################
*/

// FUNCTION : Local Storage Send
bk_so_integration.functions.localstorage_sender = function(data, name_of_var) {

	if (typeof(Storage) !== "undefined") {

		bk_so_integration.functions.logger("BLUEKAI SO : LOCAL STORAGE : storing '" + JSON.stringify(data) + "' as '" + name_of_var + "' in local storage");
		localStorage.setItem(name_of_var, JSON.stringify(data));

	} else {

		bk_so_integration.functions.logger("BLUEKAI SO : LOCAL STORAGE : SEND DATA : HTML 5 NOT SUPPORTED");
		return "no storage"; // HTML 5 NOT SUPPORTED
	}

}

// FUNCTION : Local Storage Retrieve
bk_so_integration.functions.localstorage_retriever = function(name_of_var) {

	if (typeof(Storage) !== "undefined") {

		return JSON.parse(localStorage.getItem(name_of_var));

	} else {

		bk_so_integration.functions.logger("BLUEKAI SO : LOCAL STORAGE : SEND DATA : HTML 5 NOT SUPPORTED");
		return "no storage"; // HTML 5 NOT SUPPORTED
	}

}

// FUNCTION : Local Storage fallback
bk_so_integration.functions.localstorage_fallback = function() {

	bk_so_integration.functions.logger("BLUEKAI SO : Local Storage : attempting fallback");

	// category IDs
	if (bk_so_integration.functions.localstorage_retriever("bk_cat_ids") !== "no storage") {

		window.bk_so_integration.data.bk_category_ids = bk_so_integration.functions.localstorage_retriever("bk_cat_ids");
		window.bk_so_integration.data.bk_campaign_ids = bk_so_integration.functions.localstorage_retriever("bk_campaign_ids");

		if (!window.bk_so_integration.data.bk_campaign_ids) {
			bk_so_integration.functions.logger("BLUEKAI SO : Local Storage : no campaign IDs available in local storage");
		} else {
			bk_so_integration.functions.logger("BLUEKAI SO : Local Storage : Retrieved following 'bk_campaign_ids' from local storage : " + window.bk_so_integration.data.bk_campaign_ids);
		}

		if (!window.bk_so_integration.data.bk_category_ids) {
			bk_so_integration.functions.logger("BLUEKAI SO : Local Storage : no category IDs available in local storage");
		} else {
			bk_so_integration.functions.logger("BLUEKAI SO : Local Storage : Retrieved following 'bk_category_ids' from local storage : " + window.bk_so_integration.data.bk_category_ids);
		}

		// Send data to DFP            
		bk_so_integration.functions.sendTargets();
	}
}

bk_so_integration.functions.logger = function(message, attribute_object) {

	if (document.location.href.indexOf('bk_so_logger=true') > -1) {

		//session cookie
		document.cookie = "bk_so_logger=" + "true" +
			";path=/;domain=" + document.domain + ";expires=";
	}

	if (document.cookie.indexOf('bk_so_logger=true') > -1) {

		if (typeof attribute_object === "undefined") {
			console.log(message);
		} else {
			for (varName in attribute_object) {
				console.log(message + varName + "=" + attribute_object[varName]);
			}
		}
	}

};

// FUNCTION : Parse BlueKai data and send to DFP
bk_so_integration.functions.parseBkResults = function() {


	// Parse BlueKai Campaign Results
	window.bk_so_integration.data.bk_category_ids = [];
	window.bk_so_integration.data.bk_campaign_ids = [];

	if (typeof(bk_results) != "undefined") {

		if (typeof(bk_results.campaigns[0]) != "undefined") {

			bk_so_integration.functions.logger("BLUEKAI SO : 'bk_results' object found");

			for (var i = 0; i < bk_results.campaigns.length; i++) {

				window.bk_so_integration.data.bk_campaign_ids.push(bk_results.campaigns[i].campaign);

				for (var j = 0; j < bk_results.campaigns[i].categories.length; j++) {

					if (typeof(bk_results.campaigns[i].categories[j].categoryID) != "undefined") {

						window.bk_so_integration.data.bk_category_ids.push(bk_results.campaigns[i].categories[j].categoryID);

					}
				}
			}

			// Send data to Local Storage
			bk_so_integration.functions.localstorage_sender(window.bk_so_integration.data.bk_category_ids, "bk_cat_ids");
			bk_so_integration.functions.localstorage_sender(window.bk_so_integration.data.bk_campaign_ids, "bk_campaign_ids");

			// Send data to DFP            
			bk_so_integration.functions.sendTargets();

		} else {

			bk_so_integration.functions.logger("BLUEKAI SO : No campaigns object");
		}
	}
}


bk_so_integration.functions.sendTargets = function() {
	
	bk_so_integration.functions.logger("BLUEKAI SO : Determine target systems to send data")
	
	//bk_so_integration.functions.sendDFP()
}

bk_so_integration.functions.sendDFP = function() {
	
	if (!window.bk_so_integration.data.so_sent) {

		var googletag = googletag || {};
		googletag.cmd = googletag.cmd || [];
		
		// Surface attributes to DFP
		googletag.cmd.push(function() {

			googletag.pubads().setTargeting('bk_campids', window.bk_so_integration.data.bk_campaign_ids);
			bk_so_integration.functions.logger("BLUEKAI SO : DFP SEND : EXECUTED : Declared Targeting Parameter 'bk_campids' with following array : " + window.bk_so_integration.data.bk_campaign_ids + " (see syntax below)");
			bk_so_integration.functions.logger("BLUEKAI SO : DFP SEND : EXECUTED : Syntax 'googletag.pubads().setTargeting('bk_campids', window.bk_so_integration.data.bk_campaign_ids);'");
			googletag.pubads().setTargeting('bk_catids', window.bk_so_integration.data.bk_category_ids);
			bk_so_integration.functions.logger("BLUEKAI SO : DFP SEND : EXECUTED : Declared Targeting Parameter 'bk_catids' with following array : " + window.bk_so_integration.data.bk_category_ids + " (see syntax below)");
			bk_so_integration.functions.logger("BLUEKAI SO : DFP SEND : EXECUTED : Syntax 'googletag.pubads().setTargeting('bk_campids', window.bk_so_integration.data.bk_category_ids);'");
		});

		window.bk_so_integration.data.so_sent = true; // flag so data not send twice

		bk_so_integration.functions.logger("BLUEKAI SO : DFP SEND : QUEUED : Declared Targeting Parameter 'bk_campids' with following array : " + window.bk_so_integration.data.bk_campaign_ids + " (see syntax below)");
		bk_so_integration.functions.logger("BLUEKAI SO : DFP SEND : QUEUED : Syntax 'googletag.pubads().setTargeting('bk_campids', window.bk_so_integration.data.bk_campaign_ids);'");
		bk_so_integration.functions.logger("BLUEKAI SO : DFP SEND : QUEUED : Declared Targeting Parameter 'bk_catids' with following array : " + window.bk_so_integration.data.bk_category_ids + " (see syntax below)");
		bk_so_integration.functions.logger("BLUEKAI SO : DFP SEND : QUEUED : Syntax 'googletag.pubads().setTargeting('bk_campids', window.bk_so_integration.data.bk_category_ids);'");

	} else {

		bk_so_integration.functions.logger("BLUEKAI SO : DFP SEND : NOT SENT : data already declared");

	};
}

// FUNCTION : Call BlueKai
bk_so_integration.functions.callBlueKai = function(bluekai_jsonreturn_id) {

	// Check if JSON return tag and bk_results already there
	if ((window.bk_results) && (document.head && document.head.innerHTML.indexOf(bluekai_jsonreturn_id + '?ret=js') > -1) || (document.body && document.body.innerHTML.indexOf(bluekai_jsonreturn_id + '?ret=js') > -1)) {

		bk_so_integration.functions.logger("BLUEKAI SO : JSON Return tag found");
		bk_so_integration.functions.logger("BLUEKAI SO : Parsing 'bk_results' directly");
		bk_so_integration.functions.parseBkResults(); // Parse results (don't call JSON ret tag)        

	} else {
		
		bk_so_integration.functions.logger("BLUEKAI SO : JSON Return tag NOT found");
		bk_so_integration.functions.localstorage_fallback(); // Grab from local storage
		bk_so_integration.functions.logger("BLUEKAI SO : Waiting " + window.bk_so_integration.wait_in_ms + "ms before calling JSON Return Tag");

		setTimeout(function() {

				bk_so_integration.functions.logger("BLUEKAI SO : Calling JSON Return tag");
				var bk_json_ret = document.createElement("script");
				bk_json_ret.type = "text/javascript";
				bk_json_ret.onload = function() {
					bk_so_integration.functions.logger("BLUEKAI SO : JSON Return tag loaded");
					bk_so_integration.functions.logger("BLUEKAI SO : Parsing 'bk_results'");
					bk_so_integration.functions.parseBkResults(); // Parse results
				};
				bk_so_integration.functions.parseBkResults(); // Parse results
				bk_json_ret.src = "//tags.bluekai.com/site/" + bluekai_jsonreturn_id + "?ret=js&limit=1&integration=so";

				document.head.appendChild(bk_json_ret);

			},
			window.bk_so_integration.wait_in_ms);
	}
};

// RUN CODE
bk_so_integration.functions.callBlueKai(window.bk_so_integration.bluekai_jsonreturn_id);