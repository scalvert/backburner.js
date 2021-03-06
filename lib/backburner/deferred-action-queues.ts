import Queue, { QUEUE_STATE } from './queue';

export default class DeferredActionQueues {
  public queues: { [name: string]: Queue } = {};

  private queueNames: string[];
  private queueNameIndex = 0;

  constructor(queueNames: string[] = [], options: any) {
    this.queueNames = queueNames;

    queueNames.reduce(function(queues, queueName) {
      queues[queueName] = new Queue(queueName, options[queueName], options);
      return queues;
    }, this.queues);
  }

  /*
    @method schedule
    @param {String} queueName
    @param {Any} target
    @param {Any} method
    @param {Any} args
    @param {Boolean} onceFlag
    @param {Any} stack
    @return queue
  */
  public schedule(queueName: string, target: any, method: any, args: any, onceFlag: boolean, stack: any) {
    let queues = this.queues;
    let queue = queues[queueName];

    if (queue === undefined) {
      throw new Error(`You attempted to schedule an action in a queue (${queueName}) that doesn\'t exist`);
    }

    if (method === undefined || method === null) {
      throw new Error(`You attempted to schedule an action in a queue (${queueName}) for a method that doesn\'t exist`);
    }

    this.queueNameIndex = 0;

    if (onceFlag) {
      return queue.pushUnique(target, method, args, stack);
    } else {
      return queue.push(target, method, args, stack);
    }
  }

  /*
    @method flush
    DeferredActionQueues.flush() calls Queue.flush()
  */
  public flush(fromAutorun = false) {
    let queue;
    let queueName;
    let numberOfQueues = this.queueNames.length;

    while (this.queueNameIndex < numberOfQueues) {
      queueName = this.queueNames[this.queueNameIndex];
      queue = this.queues[queueName];

      if (queue.hasWork() === false) {
        this.queueNameIndex++;
        if (fromAutorun && this.queueNameIndex < numberOfQueues) {
          return QUEUE_STATE.Pause;
        }
      } else {
        if (queue.flush(false /* async */) === QUEUE_STATE.Pause) {
          return QUEUE_STATE.Pause;
        }
      }
    }
  }
}
