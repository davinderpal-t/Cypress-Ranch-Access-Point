const Grade = require("./Grade");

class Average {
    constructor(grade, grades) {
        this.grade = grade;
        this.grades = grades;
    }
    /**
     * 
     * @param {Grade[]} arr 
     * @returns {Number}
     */
    getAverage(arr) {
        let dgSum = 0, dgMax = 0;
        let raSum = 0, raMax = 0;
        let mgSum = 0, mgMax = 0;
        let dgWeight = 1, raWeight = 1, mgWeight = 1;

        arr.forEach(/**@param {Grade} g*/g => {
            switch (g.type) {
                case "Checking for Understanding":
                    dgSum += g.grade * g.customWeight;
                    dgMax += g.max * g.customWeight;
                    dgWeight = g.weight;
                    break;
                case "Relevant Applications":
                    raSum += g.grade * g.customWeight;
                    raMax += g.max * g.customWeight;
                    raWeight = g.weight;
                    break;
                case "Summative Assessments":
                    mgSum += g.grade * g.customWeight;
                    mgMax += g.max * g.customWeight;
                    mgWeight = g.weight;
                    break;
            }
        });
        let avg = 0;
        if (dgMax != 0)
            avg += dgSum / dgMax * dgWeight;
        if (raMax != 0)
            avg += raSum / raMax * raWeight;
        if (mgMax != 0)
            avg += mgSum / mgMax * mgWeight;
        return avg;
    }

    testGrade(x) {
        return (this.grade * this.grades + x) / (this.grades + 1);
    }
}

module.exports = Average;