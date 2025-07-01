using { Prompt as my } from '../db/schema.cds';

@path : '/service/askService'
service askService {
    action Ask(prompt: String) returns {
        value: String;
    };

    @odata.draft.enabled
    entity Prompt as projection on my.Prompt;
}

// Comment out authentication for testing
// annotate askService with @requires : [
//     'authenticated-user'
// ];