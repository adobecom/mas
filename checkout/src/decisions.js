import { MODAL_TYPE_3_IN_1 } from './constants.js';

const DOC_CLOUD_FALLBACKS = {
    'vQmS1H18A6_kPd0tYBgKnp-TQIF0GbT6p8SH8rWcLMs': 'commitment',
    'ZZQMV2cU-SWQoDxuznonUFMRdxSyTr4J3fB77YBNakY': 'commitment',
    'vV01ci-KLH6hYdRfUKMBFx009hdpxZcIRG1-BY_PutE': 'recommendation',
    'nTbB50pS4lLGv_x1l_UKggd-lxxo2zAJ7WYDa2mW19s': 'recommendation',
    'QgYu51CVY2wKyFEqMuvec4N1tc1OaCypeKJjT5n2-Fc': 'commitment',
    'AW-jV275GNYtPao6Q7XWENqyv_Stkc1BbzF7ak2u1dk': 'recommendation',
    'nIy-IPGnALw3KNncaqMjOJsMUrqElWi8sdGnBFBAgTw': 'commitment',
    WRe4gUHuyqJgCCr3ZywwU9CDP0ezBaCKoMk4xryVQhs: 'commitment',
    Hnk2P6L5wYhnpZLFYTW5upuk2Y3AJXlso8VGWQ0l2TI: 'commitment',
    '-lYm-YaTSZoUgv1gzqCgybgFotLqRsLwf8CgYdvdnsQ': 'commitment',
    WJLr3TF4T4qyJIGZTsDf9KPbTfxA7qAgStpaF2IgYao: 'commitment',
    '8Lr09qx_PHqAJUwvUNiof4FFFEKjsR1TTbvBUncV2b0': 'recommendation',
    lI5NvdLBWJUJEHkP9CAx787kt0uCc3WnoCFVVIjECiA: 'recommendation',
    'OQ1oCm1tZG35Gj7LCrkGeOOdUMfVlC7xx-7ml-CTWIE': 'commitment',
    'VQpXGYJh-MBOcGPvokz_INgE88dj3KIyMJaU-iIQxlY': 'commitment',
    'b-xXdWqVkpll0yBirom1c4bI3FwdXvNCy1HtHZV2yfU': 'commitment',
    ZfP6XPHxvTFnOS_Hd4q9taPkKHinmf6PCozeJEmzqNI: 'recommendation',
    'NNe0xkjqasLN3Q0ASuv3ZB4zSQW-iVN4TBoHOkQBEOA': 'commitment',
    zX46r0tn5frbNvEMCdBg5WhZnq2hfl0qamka1iZGKTY: 'commitment',
    '6hVc9P54QOeatmbtX4XyQ5zW2TE_O4TAiDCjQXUqJWI': 'recommendation',
    TqjFogVsgvoHMvBD2LQgOXuNnrfsLmy0M9WK33I_A3k: 'recommendation',
    V3W0kzf4e6M2Ht1hP9ZAt3dQNmhuDFrmYmEPlE2SlG0: 'recommendation',
    x0LkInr7lGkqK8dcTFS_Pc6oHauo_g7N_4yWT_gLn20: 'recommendation',
    SfkorgyrBAsqBVpyKddQQEn6jR0ItBohpXc74sZcKHg: 'recommendation',
    'PVhDPYXq4fsy15OdlEE-XyIlvcxaPMxGs73pw39Cx-s': 'recommendation',
    gW9NJdpWgZIt7aqMhaXWOZDGxw7fXoNWDidbAlbxmkM: 'recommendation',
    PSR1sIFrfnd7GbeJoMVM5xPg2QaBubKxyIaDFGXTqoM: 'recommendation',
    SaDEVpzcaBu6JtP_RjK0EJbNRSwiNX_UIaG8F4Lf8yI: 'recommendation',
    cOOJwqv72rJWtLKhSHlrhrnVABtxdfjQ4lNcF1y5X2Q: 'recommendation',
    KpLJEx0tFMmVCW4KU4bppGQg7o3OAebp8KNOnGLNgiw: 'recommendation',
    'SBiUQ3H21rpQGs31u0-pGHX-jcpvjJSJYNxmFeEGDj8': 'recommendation',
    F7YL_Ablk1mj4MF4FT32jzS7u_hNUsqt_UoaUEZkexk: 'recommendation',
    'qwBmdeAU9yPBtbmSrO-TnwapD9-z6F4jIq1dHVUfIJk': 'recommendation',
    mi2GqN0SGzU9eWxF1vn1MtsIQ7pP5PTSSKT5HnXi3Vg: 'recommendation',
    eNe5xAVMmF6WtNDSifrDSsSfkmZxND76o060E1C6lJs: 'recommendation',
    KtBGnaQbFxqhj1oFfUhfBv5ekrjjs6RNhsdUdpepncs: 'recommendation',
    qrMZa9oQONjCdGbfO6JR1J9Bn_LLkrdnRAJNX4uFhxo: 'recommendation',
    'ES77iNtc3eI6yGyTX448vllSQin-gkfD3Vqlismwk6g': 'recommendation',
    'X_7yAluJ1_Y_sCBlmn5X9SMbPvgm-13QKiHQ3sP24Po': 'recommendation',
    XCxvvwhW4bTMvdhQOqT2aKDhyKEK3RvWijc1ufcNXu8: 'recommendation',
    'AxowWN4uq06O9UebM8yS1Nc6_DfFLkIsbSJvob-puoA': 'recommendation',
    JbcIubaMmXtJqaArGtYvyUme1xZnchhMnuewoypvFGY: 'recommendation',
    tB1vslYEbXdKzXW7m1EM2Yu1TaJimAtDdCO7ZgjnSC0: 'recommendation',
    aiUTLe7MdD_Wkuzs_uyAH7wuQf0Ssv5ju0ab87rIG6A: 'recommendation',
    'PXATerSqqGE5cZ4wN3_4fT6hwZ7enxL1LuLWn5CJ-Po': 'recommendation',
    MPq85MQytgz4DH3qsgomuI0tzNxVJf1TuuqDHaMi_wc: 'recommendation',
    zuIsmHec4TP5H2IIh1oGUn3roG_HRFiHh6LNsG5bwgY: 'recommendation',
    'WqJNINLwUkui0QA0NTv-OxkqY0TP2KnZedACEvnfh6g': 'recommendation',
    OmPhlAOindqQ4fvV4adVu1S44qcO5yVpzuWTUWDXPAo: 'recommendation',
    '68YcfYFAr5FmEmynFDMYRMcHStNJkxYCPBBsUWh1qpQ': 'recommendation',
    'yh5S74XAlRdtheBS1Q8avyBi-Ui400fgM5MYyCPhlaQ': 'recommendation',
    BFbVVIHlzzEGqwBdqwIF5k6N0V_od5k9UVpFONYC7aQ: 'recommendation',
    'oa-bRVTTC_EXxFaOlhZNYAfUHsNDJRJIxAN2cHU_lnw': 'recommendation',
    'JzM9USGjYmbUcdPX-WoVwt458J81NkYz8KdL2hmB6ZY': 'recommendation',
    'IGqwOFux-_4f56UGf1ilJS-rnsCjt0LrWfH7Csw7yF4': 'recommendation',
    '_rYETpAnWKeCdn5GtQTZiuSUPQ9--uAXilfF1KMky68': 'recommendation',
    I4tApjavP11Z52iores5zt_Az3eyzxlZHQchQHbN6zo: 'recommendation',
    Z6Xvxln8V31ZfAF5lJnKM6bA3hpNaLRRotOjtVTXhVE: 'recommendation',
    _nP3vmyJ78JBBnUtmSukdgWTnLAsNvGuITms2uRrJTo: 'recommendation',
    '_oXYwJY-EaBPhYSlVuyYeWu9M8ADuiHwtQo64vHhHUM': 'recommendation',
    'b2wqN8pAXvqJmrRKecLoiJjAZ_yPMsJgHpo-eAu8BDk': 'recommendation',
};

export function is3in1Modal(modal) {
    return Object.values(MODAL_TYPE_3_IN_1).includes(modal);
}

export function isOpen3in1Modal({ modal, threeInOneEnabled = true }) {
    return is3in1Modal(modal) && threeInOneEnabled;
}

export function resolveWorkflowFallback({
    modal,
    fallbackStep,
    wcsOsi,
    checkoutClientId,
    checkoutWorkflowStep,
    threeInOneEnabled = true,
}) {
    const fallback = fallbackStep ?? (checkoutClientId === 'doc_cloud' ? DOC_CLOUD_FALLBACKS[wcsOsi] : undefined);
    const fallbackUsed = is3in1Modal(modal) && !threeInOneEnabled && !!fallback;
    return {
        checkoutWorkflowStep: fallbackUsed ? fallback : checkoutWorkflowStep,
        modal: fallbackUsed ? undefined : modal,
        fallbackUsed,
    };
}

export function selectCheckoutConfig({ configs, productArrangementCode, productCode, productFamily, locale, svar }) {
    const sorted = [...configs].sort((a, b) => (a.PRODUCT_FAMILY.includes('+') && !b.PRODUCT_FAMILY.includes('+') ? -1 : 1));
    const candidates = [productArrangementCode, productCode, productFamily].flatMap((product) => {
        const matches = [];
        for (const config of sorted) {
            const match = config.PRODUCT_FAMILY === product || (svar && config.PRODUCT_FAMILY === `${product}+${svar}`);
            if (match && !matches.some((item) => item.PRODUCT_FAMILY === `${product}+${svar}`)) {
                matches.push(config);
            }
        }
        return matches;
    });
    if (!candidates.length) return undefined;
    const base = candidates.find((config) => config.LOCALE === '');
    const override = candidates.find((config) => config.LOCALE === locale) ?? {};
    const result = {
        ...base,
        ...Object.fromEntries(Object.entries(override).filter(([, value]) => value)),
    };
    for (const [key, value] of Object.entries(result)) {
        if (value === 'X' || value === '\u274c') result[key] = '';
    }
    return result;
}

function modalColumn({ modal, isOpen3in1, offerType }, suffix) {
    if (modal === 'crm' && !isOpen3in1) return `CRM_${suffix}`;
    return `${offerType === 'TRIAL' ? 'FREE_TRIAL' : 'BUY_NOW'}_${suffix}`;
}

export function selectModalHash({ config, modal, isOpen3in1, offerType }) {
    if (!config || !offerType) return undefined;
    return config[modalColumn({ modal, isOpen3in1, offerType }, 'HASH')];
}

export function selectModalPath({ config, modal, isOpen3in1, offerType, isCheckoutLink, customerSegment, marketSegments }) {
    let path = config[modalColumn({ modal, isOpen3in1, offerType }, 'PATH')];
    if (path?.includes('|') && !isOpen3in1) {
        const segment = isCheckoutLink ? `${customerSegment}_${marketSegments?.[0]}` : '';
        const segments = ['INDIVIDUAL_COM', 'TEAM_COM', 'INDIVIDUAL_EDU', 'TEAM_EDU'];
        // Preserve the legacy error for unknown segments or missing path entries.
        const index = segments.indexOf(segment) || 0;
        path = path.split('|')[index].trim();
    }
    return path;
}

// Additive browser capability: keep V1 stable while older Milo deployments coexist.
export const checkoutDecisionsV1 = Object.freeze({
    is3in1Modal,
    isOpen3in1Modal,
    resolveWorkflowFallback,
    selectCheckoutConfig,
    selectModalHash,
    selectModalPath,
});
