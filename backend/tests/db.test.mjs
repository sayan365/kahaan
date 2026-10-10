import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepository } from '../src/lib/db.mjs';
test('DynamoDB vote uses one atomic transaction with uniqueness and creator conditions',async()=>{
  const commands=[];const repo=createRepository({send:async command=>{commands.push(command.input);return {};}},{places:'Places',votes:'Votes'});
  await repo.vote({area:'pilot',placeId:'1',userId:'user',voteType:'report'});
  assert.equal(commands.length,1);const operations=commands[0].TransactItems;
  assert.equal(operations.length,2);
  assert.equal(operations[0].Put.ConditionExpression,'attribute_not_exists(userId)');
  assert.equal(operations[1].Update.ExpressionAttributeNames['#count'],'reportCount');
  assert.match(operations[1].Update.ConditionExpression,/#creator <> :user/);
  assert.deepEqual(operations[1].Update.Key,{area:'pilot',placeId:'1'});
});
test('transaction uniqueness conflicts are 409; infrastructure failures are not mislabelled',async()=>{
  const fail=Object.assign(new Error('cancelled'),{name:'TransactionCanceledException',CancellationReasons:[{Code:'ConditionalCheckFailed'},{Code:'None'}]});
  const repo=createRepository({send:async()=>{throw fail;}},{places:'Places',votes:'Votes'});
  await assert.rejects(repo.vote({voteType:'confirm'}),{status:409,code:'already_voted'});
  fail.CancellationReasons=[{Code:'None'},{Code:'ConditionalCheckFailed'}];
  await assert.rejects(repo.vote({voteType:'confirm'}),{status:409,code:'place_changed'});
  fail.name='ProvisionedThroughputExceededException';
  await assert.rejects(repo.vote({voteType:'confirm'}),{name:'ProvisionedThroughputExceededException'});
});
test('listing exhausts DynamoDB pages instead of silently truncating data',async()=>{
  const calls=[];const repo=createRepository({send:async c=>{calls.push(c.input);return calls.length===1?{Items:[{placeId:'a'}],LastEvaluatedKey:{area:'pilot',placeId:'a'}}:{Items:[{placeId:'b'}]};}},{places:'Places',votes:'Votes'});
  assert.deepEqual((await repo.list('pilot')).map(p=>p.placeId),['a','b']);
  assert.deepEqual(calls[1].ExclusiveStartKey,{area:'pilot',placeId:'a'});
});
