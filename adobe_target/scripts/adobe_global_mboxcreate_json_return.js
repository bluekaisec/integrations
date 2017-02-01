/*
#######################################################################################
### ORACLE BLUEKAI : ADOBE TARGET : GLOBAL BOX : mboxCreate() : JSON Return handler ###
#######################################################################################

Author : roshan.gonsalkorale@oracle.com

Notes:

- Only tested to work with global mbox
- Will call BlueKai JSON Return tag asynchronously if not already loaded (http://tags.bluekai.com/site/XXXXX?ret=js&limit=1)
- Sends data via mboxCreate() (https://marketing.adobe.com/resources/help/en_US/target/ov2/r_target-atjs-mboxcreate.html)
- Following code to be pasted at end of mbox.js code (or at any point after mbox.js has run)
- Set cookie "bk_adobet_logger=true" to enable consolelogging

*/

// CONFIG : EDIT THIS PART

// Create object to store functions
window.bk_adobet_integration = {};
window.bk_adobet_integration.functions = {};
window.bk_adobet_integration.data = {};
window.bk_adobet_integration.bluekai_jsonreturn_id = "39538"; // CHANGE TO YOUR ID

/* 
##########################################################################################
DO NOT EDIT BELOW THIS LINE
##########################################################################################
*/


// FUNCTION : Logger
bk_adobet_integration.functions.logger = function(message) {

	if (document.cookie.indexOf('bk_adobet_logger=true') > -1) {
		console.log(message);
	}

}

// FUNCTION : Parse BlueKai data and send to Adobe Target
bk_adobet_integration.functions.parseBkResults = function() {

	
	// Parse BlueKai Campaign Results
	window.bk_adobet_integration.data.bkCatIdSt = ",";
	window.bk_adobet_integration.data.bkCampStr = ",";

	if (typeof(bk_results) != "undefined") {

		if (typeof(bk_results.campaigns[0]) != "undefined") {
			//if (typeof(bk_results) != "undefined" && typeof(bk_results.campaigns) != "undefined") {

			bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : 'bk_results' object found");

			for (var i = 0; i < bk_results.campaigns.length; i++) {

				window.bk_adobet_integration.data.bkCampStr += bk_results.campaigns[i].campaign + ",";

				for (var j = 0; j < bk_results.campaigns[i].categories.length; j++) {

					if (typeof(bk_results.campaigns[i].categories[j].categoryID) != "undefined") {
						
						window.bk_adobet_integration.data.bkCatIdSt += bk_results.campaigns[i].categories[j].categoryID + ",";

					}
				}
				
			}

			bk_adobet_integration.functions.generateMbox(); // Generate mbox

		} else {
			bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : No campaigns object");
		}

	} else {
		bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : No 'bk_results' object");
	}

}

bk_adobet_integration.functions.generateMbox = function() {

	// Parse BlueKai Campaign Results
	window.bk_adobet_integration.data.insertProfileBKCamps = ("profile.bkCamps=" + window.bk_adobet_integration.data.bkCampStr);
	window.bk_adobet_integration.data.insertProfileBKCatIds = ("profile.bkCatIds=" + window.bk_adobet_integration.data.bkCatIdSt);

	// Parse BlueKai Campaign Results
	if (typeof mboxDefine === "function") {
		
		bk_adobet_integration.div = document.createElement("div");
		bk_adobet_integration.div.id = "oracle_bluekai_mbox_div";
		document.body.appendChild(bk_adobet_integration.div);
		bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : mbox <div id='oracle_bluekai_mbox_div'> created");

		mboxDefine('oracle_bluekai_mbox_div', 'oracle_bluekai_mbox', window.bk_adobet_integration.data.insertProfileBKCamps, window.bk_adobet_integration.data.insertProfileBKCatIds);
		mboxUpdate('oracle_bluekai_mbox');

		bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : mbox defined");
		bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : mboxDefine('oracle_bluekai_mbox_div','oracle_bluekai_mbox'," + window.bk_adobet_integration.data.insertProfileBKCamps + "," + window.bk_adobet_integration.data.insertProfileBKCatIds + ");")


	} else {
		bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : mboxDefine() doesn't exist");
	}

}

// FUNCTION : Call BlueKai
bk_adobet_integration.functions.callBlueKai = function(bluekai_jsonreturn_id) {
	
	// Check if JSON return tag already there
	if (document.head.innerHTML.indexOf(bluekai_jsonreturn_id + '?ret=js') > -1 || document.body.innerHTML.indexOf(bluekai_jsonreturn_id + '?ret=js') > -1) {

		bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : JSON Return tag found");
		bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : Parsing 'bk_results' directly");
		bk_adobet_integration.functions.parseBkResults(); // Parse results (don't call JSON ret tag)		

	} else {

		bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : JSON Return tag NOT found");
		bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : Calling JSON Return tag");
		var bk_json_ret = document.createElement("script");
		bk_json_ret.type = "text/javascript";
		bk_json_ret.onload = function() {
			bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : JSON Return tag loaded");
			bk_adobet_integration.functions.logger("BLUEKAI ADOBE TARGET : Parsing 'bk_results'");
			bk_adobet_integration.functions.parseBkResults(); // Parse results
		};
		bk_json_ret.src = "//tags.bluekai.com/site/" + bluekai_jsonreturn_id + "?ret=js&limit=1";
		document.head.appendChild(bk_json_ret);
	}

}

// RUN CODE
bk_adobet_integration.functions.callBlueKai(window.bk_adobet_integration.bluekai_jsonreturn_id); // CHANGE NUMBER TO YOUR BLUEKAI SITE IT FOR JSON RETURN TAG