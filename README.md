Tumstock - a metric API
===

Tumstock (yardstick in Swedish) is a simple API for publishing and retrieving simple metrics. 

The API has three endpoints:
```
POST /tumstock/{name} 
{
   <key>: <value>+
}

GET /tumstock/{name}
->
{
   <key>: <value>+
}

GET /tumstock/{name}/{key}
->
{
  <key>: <value>
}
```

In addition there is a convenience API that can be used as a pingdom webhook.

```
POST /pingdom
{
 ... pingdom event ...
}
```

The tumstock API does a hmset in redis followed by a publish to the tumstock channel. The pingdom API results in a publish to the pingdom channel after a format validation.
