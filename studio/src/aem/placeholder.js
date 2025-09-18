import { Fragment } from './fragment.js';

export class Placeholder extends Fragment {
    get key() {
        return this.getFieldValue('key');
    }

    get isRichText() {
        const initialRichTextValue = this.initialValue.fields.find((field) => field.name === 'richTextValue');
        return initialRichTextValue.values.length > 0;
    }

    get value() {
        const valuefield = this.isRichText ? 'richTextValue' : 'value';
        return this.getFieldValue(valuefield);
    }

    get updatedBy() {
        return this.modified?.by || 'Unknown';
    }

    get updatedAt() {
        return this.modified?.at ? new Date(this.modified?.at).toLocaleString() : 'Unknown';
    }
}
