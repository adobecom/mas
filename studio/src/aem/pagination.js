export class Pagination {
    page;
    size;

    constructor() {
        this.page = 1;
        this.size = 50;
    }

    selectPage(value) {
        this.page = value;
    }

    nextPage(total) {
        if (this.page > this.getPages(total)) return false;
        this.page += 1;
        return true;
    }

    previousPage() {
        if (this.page <= 0) return;
        this.page -= 1;
    }

    setSize(value) {
        this.size = value;
        this.selectPage(1);
    }

    getPages(total) {
        if (total === 0) return 1;
        return Math.floor(total / this.size) + (total % this.size === 0 ? 0 : 1);
    }
}
