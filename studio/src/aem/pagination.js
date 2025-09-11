export class Pagination {
    page;
    size;

    constructor() {
        this.page = 1;
        this.size = 10;
    }

    selectPage(value) {
        this.page = value;
    }

    navigateForward() {
        if (this.page > this.pages) return;
        this.page += 1;
    }

    navigateBackward() {
        if (this.page <= 0) return;
        this.page -= 1;
    }

    setSize(value) {
        this.size = value;
        this.selectPage(1);
    }
}
