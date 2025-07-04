/**
 * Code is auto-generated by Application Logic, DO NOT EDIT.
 * @version(2.0)
 */
const LCAPApplicationService = require('@sap/low-code-event-handler');
const prompt_Logic = require('./code/prompt-logic');

class askService extends LCAPApplicationService {
    async init() {

        this.on('Ask', async (request) => {
            return prompt_Logic(request);
        });

        return super.init();
    }
}


module.exports = {
    askService
};