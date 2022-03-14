let workerFarm = require('worker-farm');

class Farm {
    constructor() {
        this.open = 0;
        this.finished = 0;
        this.running = false;
    }

    run(user, pass) {
        if (!this.running) {
            this.running = true;
            workerFarm = require("worker-farm");
            this.workers = workerFarm(require.resolve('./index'));
        }
        return new Promise((res, rej) => {
            this.open++;
            this.workers([user, pass], (err, outp) => {
                this.finished++;
                if (this.finished == this.open) {
                    this.open = 0;
                    this.finished = 0;
                    workerFarm.end(this.workers);
                    this.running = false;
                }
                res(outp);
            });
        });
    }
}

module.exports = Farm;