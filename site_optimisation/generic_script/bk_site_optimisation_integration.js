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
window.bk_so_integration.bluekai_jsonreturn_id = "46773"; // replace with your
// JSON Return
// Container ID
window.bk_so_integration.wait_in_ms = 5000; // How long to wait before asking
// BlueKai for the latest categories
// and firing data to third party
// (default 5000ms)

window.bk_so_integration.adobe_company = "oracleexchangepartne";

window.bk_so_integration.enable_dfp = false;

window.bk_so_integration.enable_adobetarget = true;

/*
 * ##########################################################################################
 * DO NOT EDIT BELOW THIS LINE
 * ##########################################################################################
 */

// FUNCTION : Local Storage Send
bk_so_integration.functions.localstorage_sender = function(data, name_of_var) {

	if (typeof (Storage) !== "undefined") {

		bk_so_integration.functions.logger("BLUEKAI SO : LOCAL STORAGE : storing '" + JSON.stringify(data) + "' as '"
				+ name_of_var + "' in local storage");
		localStorage.setItem(name_of_var, JSON.stringify(data));

	} else {

		bk_so_integration.functions.logger("BLUEKAI SO : LOCAL STORAGE : SEND DATA : HTML 5 NOT SUPPORTED");
		return "no storage"; // HTML 5 NOT SUPPORTED
	}

}

// FUNCTION : Local Storage Retrieve
bk_so_integration.functions.localstorage_retriever = function(name_of_var) {

	if (typeof (Storage) !== "undefined") {

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

		window.bk_so_integration.data.bk_category_ids = bk_so_integration.functions
				.localstorage_retriever("bk_cat_ids");
		window.bk_so_integration.data.bk_campaign_ids = bk_so_integration.functions
				.localstorage_retriever("bk_campaign_ids");
		window.bk_so_integration.data.bk_audience_names = bk_so_integration.functions
				.localstorage_retriever("bk_audience_names");

		if (!window.bk_so_integration.data.bk_campaign_ids) {
			bk_so_integration.functions
					.logger("BLUEKAI SO : Local Storage : no campaign IDs available in local storage. Setting to empty array.");
			window.bk_so_integration.data.bk_campaign_ids = [];
		} else {
			bk_so_integration.functions
					.logger("BLUEKAI SO : Local Storage : Retrieved following 'bk_campaign_ids' from local storage : "
							+ window.bk_so_integration.data.bk_campaign_ids);
		}

		if (!window.bk_so_integration.data.bk_category_ids) {
			bk_so_integration.functions
					.logger("BLUEKAI SO : Local Storage : no category IDs available in local storage. Setting to empty array.");
			window.bk_so_integration.data.bk_category_ids = [];
		} else {
			bk_so_integration.functions
					.logger("BLUEKAI SO : Local Storage : Retrieved following 'bk_category_ids' from local storage : "
							+ window.bk_so_integration.data.bk_category_ids);
		}

		if (!window.bk_so_integration.data.bk_audience_names) {
			bk_so_integration.functions
					.logger("BLUEKAI SO : Local Storage : no audience names available in local storage. Setting to empty array.");
			window.bk_so_integration.data.bk_audience_names = [];
		} else {
			bk_so_integration.functions
					.logger("BLUEKAI SO : Local Storage : Retrieved following 'bk_audience_names' from local storage : "
							+ window.bk_so_integration.data.bk_audience_names);
		}

		// Send data to DFP
		bk_so_integration.functions.sendTargets();
	}
}

bk_so_integration.functions.logger = function(message, attribute_object) {

	if (document.location.href.indexOf('bk_so_logger=true') > -1) {

		// session cookie
		document.cookie = "bk_so_logger=" + "true" + ";path=/;domain=" + document.domain + ";expires=";
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
	window.bk_so_integration.data.bk_audience_names = [];

	if (typeof (bk_results) != "undefined") {

		if (typeof (bk_results.campaigns[0]) != "undefined") {

			bk_so_integration.functions.logger("BLUEKAI SO : 'bk_results' object found");

			for (var i = 0; i < bk_results.campaigns.length; i++) {

				window.bk_so_integration.data.bk_campaign_ids.push(bk_results.campaigns[i].campaign);

				var audience_name = bk_results.campaigns[i].BkDmpAudienceName;

				if (typeof (audience_name) != "undefined") {
					bk_so_integration.functions.logger("BLUEKAI SO : Audience name found: " + audience_name);
					window.bk_so_integration.data.bk_audience_names.push(audience_name);
				}

				for (var j = 0; j < bk_results.campaigns[i].categories.length; j++) {

					if (typeof (bk_results.campaigns[i].categories[j].categoryID) != "undefined") {

						window.bk_so_integration.data.bk_category_ids
								.push(bk_results.campaigns[i].categories[j].categoryID);

					}
				}
			}

			// Send data to Local Storage
			bk_so_integration.functions
					.localstorage_sender(window.bk_so_integration.data.bk_category_ids, "bk_cat_ids");
			bk_so_integration.functions.localstorage_sender(window.bk_so_integration.data.bk_campaign_ids,
					"bk_campaign_ids");
			bk_so_integration.functions.localstorage_sender(window.bk_so_integration.data.bk_audience_names,
					"bk_audience_names");

			// Send data to DFP
			bk_so_integration.functions.sendTargets();

		} else {

			bk_so_integration.functions.logger("BLUEKAI SO : No campaigns object");
		}
	}
}

bk_so_integration.functions.sendTargets = function() {

	bk_so_integration.functions.logger("BLUEKAI SO : Determine target systems to send data");
	
	if (window.bk_so_integration.enable_dfp) {
		bk_so_integration.functions.logger("BLUEKAI SO : DFP Enabled");
		bk_so_integration.functions.sendDFP();
	}

	if (window.bk_so_integration.enable_adobetarget) {
		bk_so_integration.functions.logger("BLUEKAI SO : Adobe Target Enabled");
		bk_so_integration.functions.sendATT();
	}
	
}

/*
 * ##########################################################################################
 * DFP CODE
 * ##########################################################################################
 */

bk_so_integration.functions.sendDFP = function() {

	if (!window.bk_so_integration.data.so_sent) {

		var googletag = googletag || {};
		googletag.cmd = googletag.cmd || [];

		// Surface attributes to DFP
		googletag.cmd
				.push(function() {

					googletag.pubads().setTargeting('bk_campids', window.bk_so_integration.data.bk_campaign_ids);
					bk_so_integration.functions
							.logger("BLUEKAI SO : DFP SEND : EXECUTED : Declared Targeting Parameter 'bk_campids' with following array : "
									+ window.bk_so_integration.data.bk_campaign_ids + " (see syntax below)");
					bk_so_integration.functions
							.logger("BLUEKAI SO : DFP SEND : EXECUTED : Syntax 'googletag.pubads().setTargeting('bk_campids', window.bk_so_integration.data.bk_campaign_ids);'");
					googletag.pubads().setTargeting('bk_catids', window.bk_so_integration.data.bk_category_ids);
					bk_so_integration.functions
							.logger("BLUEKAI SO : DFP SEND : EXECUTED : Declared Targeting Parameter 'bk_catids' with following array : "
									+ window.bk_so_integration.data.bk_category_ids + " (see syntax below)");
					bk_so_integration.functions
							.logger("BLUEKAI SO : DFP SEND : EXECUTED : Syntax 'googletag.pubads().setTargeting('bk_campids', window.bk_so_integration.data.bk_category_ids);'");
				});

		window.bk_so_integration.data.so_sent = true; // flag so data not send
		// twice

		bk_so_integration.functions
				.logger("BLUEKAI SO : DFP SEND : QUEUED : Declared Targeting Parameter 'bk_campids' with following array : "
						+ window.bk_so_integration.data.bk_campaign_ids + " (see syntax below)");
		bk_so_integration.functions
				.logger("BLUEKAI SO : DFP SEND : QUEUED : Syntax 'googletag.pubads().setTargeting('bk_campids', window.bk_so_integration.data.bk_campaign_ids);'");
		bk_so_integration.functions
				.logger("BLUEKAI SO : DFP SEND : QUEUED : Declared Targeting Parameter 'bk_catids' with following array : "
						+ window.bk_so_integration.data.bk_category_ids + " (see syntax below)");
		bk_so_integration.functions
				.logger("BLUEKAI SO : DFP SEND : QUEUED : Syntax 'googletag.pubads().setTargeting('bk_campids', window.bk_so_integration.data.bk_category_ids);'");

	} else {

		bk_so_integration.functions.logger("BLUEKAI SO : DFP SEND : NOT SENT : data already declared");

	}
	;
}

/*
 * ##########################################################################################
 * ADOBE TEST AND TARGET CODE
 * ##########################################################################################
 */

bk_so_integration.functions.sendATT = function() {

	// Parse BlueKai Campaign Results
	window.bk_so_integration.data.insertProfileBKCamps = ("profile.bkCamps=" + window.bk_so_integration.data.bk_campaign_ids
			.join(","));
	window.bk_so_integration.data.insertProfileBKCatIds = ("profile.bkCatIds=" + window.bk_so_integration.data.bk_category_ids
			.join(","));
	window.bk_so_integration.data.insertProfileBKAudienceNames = ("profile.bkAudienceNames=" + window.bk_so_integration.data.bk_audience_names
			.join(","));

	var img_url = "//" + window.bk_so_integration.adobe_company + ".tt.omtrdc.net/m2/"
			+ window.bk_so_integration.adobe_company + "/ubox/image?mbox=bk_data_feed&"
			+ window.bk_so_integration.data.insertProfileBKCamps + "&"
			+ window.bk_so_integration.data.insertProfileBKCatIds + "&"
			+ window.bk_so_integration.data.insertProfileBKAudienceNames
			+ "&mboxDefault\x3dhttp%3A%2F%2Ftags.bkrtx.com%2F1x1.gif";

	// Parse BlueKai Campaign Results
	(new Image).src = img_url;

	bk_so_integration.functions.logger("BLUEKAI ADOBE TARGET : Profile Pixel fired");
	bk_so_integration.functions.logger("BLUEKAI ADOBE TARGET : Pixel URL: " + img_url);

}

// FUNCTION : Call BlueKai
bk_so_integration.functions.callBlueKai = function(bluekai_jsonreturn_id) {
	1
	// Check if JSON return tag and bk_results already there
	if ((window.bk_results)
			&& (document.head && document.head.innerHTML.indexOf(bluekai_jsonreturn_id + '?ret=js') > -1)
			|| (document.body && document.body.innerHTML.indexOf(bluekai_jsonreturn_id + '?ret=js') > -1)) {

		bk_so_integration.functions.logger("BLUEKAI SO : JSON Return tag found");
		bk_so_integration.functions.logger("BLUEKAI SO : Parsing 'bk_results' directly");
		bk_so_integration.functions.parseBkResults(); // Parse results (don't
		// call JSON ret tag)

	} else {

		bk_so_integration.functions.logger("BLUEKAI SO : JSON Return tag NOT found");
		bk_so_integration.functions.localstorage_fallback(); // Grab from
		// local storage
		bk_so_integration.functions.logger("BLUEKAI SO : Waiting " + window.bk_so_integration.wait_in_ms
				+ "ms before calling JSON Return Tag");

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
			bk_json_ret.src = "//tags.bluekai.com/site/" + bluekai_jsonreturn_id
					+ "?ret=js&limit=1&phint=integration=so";

			document.head.appendChild(bk_json_ret);

		}, window.bk_so_integration.wait_in_ms);
	}
};

// RUN CODE
bk_so_integration.functions.callBlueKai(window.bk_so_integration.bluekai_jsonreturn_id);