class Grade {
    /**
     * 
     * @param {String} name 
     * @param {Number} grade 
     * @param {String} type 
     * @param {Number} weight 
     * @param {Number} customWeight 
     * @param {Number} max 
     */
    constructor(name, grade, type, weight, max, customWeight) {
        this.name = name;
        this.grade = grade;
        this.type = type;
        this.weight = weight;
        this.customWeight = customWeight;
        this.max = max;
    }
}

module.exports = Grade;