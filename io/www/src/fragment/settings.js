async function settings(context) {
    console.log(context);
    if (context.body?.fields?.variant === "plans"){
        context.body.settings = {
            stockCheckboxLabel: '{{stock-checkbox-label}}',
            stockOfferOsis: '',
        };
        if(context.body?.fields?.showSecureLabel !== false){
            context.body.settings.secureLabel = '{{secure-label}}';
        }
    } 
    return context;
}

exports.settings = settings;