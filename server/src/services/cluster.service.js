import ItemModel from "../models/items.model.js";
import ClusterModel from "../models/clusters.model.js";
import { generateEmbeddings } from "./embeddings.service.js";
import { queryVectors } from "./pinecone.service.js";

const MAX_EMBED_CHARS = 4000;

export async function assignClusterForItem(itemId, text) {
  const item = await ItemModel.findById(itemId)
    .select("userid tags title content")
    .lean();
  if (!item) return null;

  const docText = (text || `${item.title || ""}\n${item.content || ""}`).slice(0, MAX_EMBED_CHARS);
  if (!docText.trim()) return null;

  const vector = await generateEmbeddings(docText);
  if (!vector || vector.length === 0) return null;

  const matches = await queryVectors(vector, 10);
  const neighborItemIds = matches
    .map(m => m.metadata?.itemId)
    .filter(Boolean)
    .filter(id => id !== String(itemId));

  // Only consider same-user neighbors for clustering
  const sameUserNeighbors = await ItemModel.find({
    _id: { $in: neighborItemIds },
    userid: item.userid
  }).select("_id clusterId tags")
    .lean();

  if (sameUserNeighbors.length === 0) {
    const cluster = await ClusterModel.create({
      userId: item.userid,
      itemIds: [itemId],
      itemCount: 1,
      tags: item.tags || []
    });

    await ItemModel.findByIdAndUpdate(itemId, { clusterId: cluster._id });
    return cluster;
  }

  const clusterCounts = {};
  sameUserNeighbors.forEach((neighbor) => {
    if (neighbor.clusterId) {
      const id = String(neighbor.clusterId);
      clusterCounts[id] = (clusterCounts[id] || 0) + 1;
    }
  });

  const clusterIds = Object.keys(clusterCounts);
  if (clusterIds.length > 0) {
    const targetClusterId = clusterIds.sort((a, b) => clusterCounts[b] - clusterCounts[a])[0];

    await ItemModel.findByIdAndUpdate(itemId, { clusterId: targetClusterId });
    const cluster = await ClusterModel.findByIdAndUpdate(
      targetClusterId,
      {
        $addToSet: {
          itemIds: itemId,
          tags: { $each: item.tags || [] }
        },
        $inc: { itemCount: 1 }
      },
      { new: true }
    );

    return cluster;
  }

  const members = [itemId, ...sameUserNeighbors.slice(0, 3).map((neighbor) => String(neighbor._id))];
  const mergedTags = new Set([...(item.tags || [])]);
  sameUserNeighbors.slice(0, 3).forEach((neighbor) => {
    (neighbor.tags || []).forEach((tag) => mergedTags.add(tag));
  });

  const cluster = await ClusterModel.create({
    userId: item.userid,
    itemIds: members,
    itemCount: members.length,
    tags: Array.from(mergedTags)
  });

  await ItemModel.updateMany({ _id: { $in: members } }, { clusterId: cluster._id });
  return cluster;
}
