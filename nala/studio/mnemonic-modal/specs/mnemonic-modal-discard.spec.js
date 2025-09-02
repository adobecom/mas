export default {
    name: 'MAS Studio Mnemonic Modal Discard Tests',
    features: [
        {
            tcid: '0',
            name: '@studio-mnemonic-modal-discard-cancel',
            path: '/studio.html',
            tags: '@mas-studio @mnemonic-modal @smoke',
            browserParams: '#page=content&path=nala&query=',
            data: {
                cardid: '5a5ca143-a417-4087-b466-5b72ac68a830',
                originalIcon: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/acrobat.svg',
                newProductName: 'Lightroom',
                newProductId: 'lightroom',
                newIconURL: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/lightroom.svg',
            },
        },
        {
            tcid: '1',
            name: '@studio-mnemonic-modal-discard-escape',
            path: '/studio.html',
            tags: '@mas-studio @mnemonic-modal @regression',
            browserParams: '#page=content&path=nala&query=',
            data: {
                cardid: '5a5ca143-a417-4087-b466-5b72ac68a830',
                originalIcon: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/acrobat.svg',
                newProductName: 'Premiere Pro',
                customURL: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/premiere-pro.svg',
            },
        },
        {
            tcid: '2',
            name: '@studio-mnemonic-modal-discard-card-changes',
            path: '/studio.html',
            tags: '@mas-studio @mnemonic-modal @integration',
            browserParams: '#page=content&path=nala&query=',
            data: {
                cardid: '5a5ca143-a417-4087-b466-5b72ac68a830',
                originalTitle: 'Acrobat Pro',
                newTitle: 'Modified Title',
                originalIcon: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/acrobat.svg',
                newProductName: 'Animate',
                newIconURL: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/animate.svg',
            },
        },
        {
            tcid: '3',
            name: '@studio-mnemonic-modal-discard-underlay-click',
            path: '/studio.html',
            tags: '@mas-studio @mnemonic-modal @regression',
            browserParams: '#page=content&path=nala&query=',
            data: {
                cardid: '5a5ca143-a417-4087-b466-5b72ac68a830',
                originalIcon: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/acrobat.svg',
                newProductName: 'Dreamweaver',
            },
        },
    ],
};
