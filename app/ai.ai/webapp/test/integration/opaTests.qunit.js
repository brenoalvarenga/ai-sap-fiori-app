sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'ai/ai/test/integration/FirstJourney',
		'ai/ai/test/integration/pages/PromptMain'
    ],
    function(JourneyRunner, opaJourney, PromptMain) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('ai/ai') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onThePromptMain: PromptMain
                }
            },
            opaJourney.run
        );
    }
);