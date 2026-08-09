export const valueOf = (record, key) => {
	if (record == null) return undefined;
	if (record[key] !== undefined) return record[key];
	return typeof record.get === "function" ? record.get(key) : undefined;
};

export const valuesOf = collection => {
	if (!collection) return [];
	if (typeof collection.valueSeq === "function") return collection.valueSeq().toArray();
	return typeof collection.toArray === "function" ? collection.toArray() : collection;
};

export const immutableFieldResolver = (source, args, context, info) => valueOf(source, info.fieldName);
