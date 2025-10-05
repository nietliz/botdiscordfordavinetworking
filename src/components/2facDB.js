const { connectDB } = require('./../connectiondb');

const COLLECTION_NAME = 'twofactor';

async function saveTwoFactorRecord(record) {
	const db = await connectDB();
	await db.collection(COLLECTION_NAME).insertOne(record);
	return true;
}

async function findTwoFactorRecord(subject, token) {
	const db = await connectDB();
	return await db.collection(COLLECTION_NAME).findOne({ subject, token });
}

async function findLatestTwoFactorRecord(subject) {
	const db = await connectDB();
	return await db.collection(COLLECTION_NAME)
		.find({ subject })
		.sort({ createdAt: -1 })
		.limit(1)
		.next();
}

async function markTwoFactorUsed(subject, token) {
	const db = await connectDB();
	await db.collection(COLLECTION_NAME).updateOne(
		{ subject, token },
		{ $set: { used: true, usedAt: new Date() } }
	);
	return true;
}

async function invalidateOlderTokens(subject, exceptToken) {
	const db = await connectDB();
	await db.collection(COLLECTION_NAME).updateMany(
		{ subject, token: { $ne: exceptToken }, used: { $ne: true } },
		{ $set: { used: true, usedAt: new Date(), invalidated: true } }
	);
	return true;
}

module.exports = {
	saveTwoFactorRecord,
	findTwoFactorRecord,
	findLatestTwoFactorRecord,
	markTwoFactorUsed,
	invalidateOlderTokens
};


