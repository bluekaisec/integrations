/*
#################################################################
### ORACLE BLUEKAI : ADOBE TARGET : GLOBAL BOX : mboxCreate() ###
#################################################################

Author : roshan.gonsalkorale@oracle.com

Notes:

- Requires <script src="//tags.bluekai.com/site/INSERTCLIENTID?ret=js&limit=1"></script> to be implemented above mbox.js
- Above script can be called asynchronously but no guarantee that that BlueKai data will be available by that point
- Sends data via mboxCreate() (https://marketing.adobe.com/resources/help/en_US/target/ov2/r_target-atjs-mboxcreate.html)
- Following code to be pasted at end of mbox.js code

*/


// Parse BlueKai Campaign Results
var bkCatIdSt = ",";
var bkCampStr = ",";
if (typeof(bk_results) != "undefined" && typeof(bk_results.campaigns) != "undefined") {
	for (var i = 0; i < bk_results.campaigns.length; i++) {

		bkCampStr += bk_results.campaigns[i].campaign + ",";

		for (var j = 0; j < bk_results.campaigns[i].categories.length; j++) {

			if (typeof(bk_results.campaigns[i].categories[j].categoryID) != "undefined") {
				
				var s = bk_results.campaigns[i].categories[j].categoryID + "";
				bkCatIdSt += bk_results.campaigns[i].categories[j].categoryID + ",";

			}
		}
	}
}

// Parse BlueKai Campaign Results
var insertProfileBKCamps = ("profile.bkCamps=" + bkCampStr);
var insertProfileBKCatIds = ("profile.bkCatIds=" + bkCatIdSt);

// Parse BlueKai Campaign Results
mboxCreate('oracle_bluekai_mbox', insertProfileBKCamps, insertProfileBKCatIds);

