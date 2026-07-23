const PRODUCT_FRAGMENT_MAP = {
    'creative cloud pro': '2c5cd672-1db8-409c-96ff-46b1a1dfb7dc',
    photography: '86248907-1cb6-4d1e-8b3f-a42dee95d9bc',
    'acrobat studio': '55df6f26-c5ad-4f83-a4d3-d5e25c99059b',
    photoshop: '8413981a-2b38-46b3-813a-ae161415c6fd',
    'adobe firefly pro': 'd1026cda-f666-4cec-afb8-1457967ff474',
    'adobe premiere': 'ef427781-75e8-4d2a-92ef-29f27ac78b2a',
    illustrator: '1f55a647-2345-4fa4-be7e-372efce06a9e',
    'after effects': 'a1ca4a50-dd85-4cf9-94e2-a9e90ad4bb27',
    'adobe express premium': 'a8590cef-07de-4187-8bda-605e0c504cc0',
    'adobe firefly standard': '3336b6e9-6b81-4513-9d3d-c00185c339c0',
    'adobe firefly pro plus': '7d40eee3-1440-4cc0-bdf0-38e9d15d6ba6',
    'adobe firefly premium': '622eaa80-2b16-4a4d-a68f-88fd85674ca6',
    indesign: '3ba6880b-c1d7-45d0-b768-d830774d3168',
    lightroom: '37e7d4d8-6983-4e22-a656-5a69b00626a5',
    'acrobat pro': 'e87d6836-3a0f-4fee-8b26-d31a4ce53412',
    'acrobat express': 'c39686dd-4068-4355-a0d0-19ced94cd956',
    audition: '940b0753-4057-4f1c-9926-db056ff4436b',
    animate: '28217adf-46ad-49a7-a5c3-843f7e5c38ba',
    'adobe substance 3d collection': '8ca525ff-b299-46fd-a1fd-304873d6489c',
    'adobe substance 3d texturing': 'af758d54-3ab5-49ce-812b-476ebda02f9e',
    dreamweaver: '13bd2e38-5ef8-4ed3-a219-04f7e35c03ac',
    incopy: 'b0ff0368-02e9-46d3-8d65-12dd13abedc1',
    'acrobat standard': '1b6df606-8549-4e03-9f89-e84778b0c1ff',
    'ai assistant for acrobat': 'a64812ba-f183-4364-a55a-9d45cc549be6',
    'adobe stock ai studio': '700a8624-cc27-43b5-a6d8-148221a06c61',
};

function resolveFragmentId(productName) {
    if (!productName) return undefined;
    return PRODUCT_FRAGMENT_MAP[productName.trim().toLowerCase()];
}

export { PRODUCT_FRAGMENT_MAP, resolveFragmentId };
