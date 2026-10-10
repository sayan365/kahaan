import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { AppError } from './domain.mjs';
export function createRepository(client, tables) { return {
  async list(area) {
    let ExclusiveStartKey; const all = [];
    do {
      const result = await client.send(new QueryCommand({ TableName: tables.places, KeyConditionExpression: '#a = :a', ExpressionAttributeNames: { '#a': 'area' }, ExpressionAttributeValues: { ':a': area }, ExclusiveStartKey }));
      all.push(...(result.Items || [])); ExclusiveStartKey = result.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return all;
  },
  async get(area, placeId) { return (await client.send(new GetCommand({ TableName: tables.places, Key: { area, placeId }, ConsistentRead: true }))).Item; },
  async create(place) { await client.send(new PutCommand({ TableName: tables.places, Item: place, ConditionExpression: 'attribute_not_exists(placeId)' })); },
  async vote(vote) {
    const count = vote.voteType === 'confirm' ? 'confirmCount' : 'reportCount';
    try {
      await client.send(new TransactWriteCommand({ TransactItems: [
        { Put: { TableName: tables.votes, Item: vote, ConditionExpression: 'attribute_not_exists(userId)' } },
        { Update: { TableName: tables.places, Key: { area: vote.area, placeId: vote.placeId }, UpdateExpression: 'ADD #count :one', ExpressionAttributeNames: { '#count': count, '#creator': 'createdBy' }, ExpressionAttributeValues: { ':one': 1, ':user': vote.userId }, ConditionExpression: 'attribute_exists(placeId) AND #creator <> :user' } }
      ] }));
    } catch (error) {
      if (error.name === 'TransactionCanceledException') {
        if (error.CancellationReasons?.[0]?.Code === 'ConditionalCheckFailed') throw new AppError(409, 'already_voted');
        if (error.CancellationReasons?.[1]?.Code === 'ConditionalCheckFailed') throw new AppError(409, 'place_changed');
      }
      throw error;
    }
  }
}; }
export const repository = createRepository(DynamoDBDocumentClient.from(new DynamoDBClient({})), { places: process.env.PLACES_TABLE, votes: process.env.VOTES_TABLE });
