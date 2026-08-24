const fs = require('fs');
const content = fs.readFileSync('server/db/mysql-adapter.ts', 'utf8');
const lines = content.split('\n');

const part1 = lines.slice(0, 653);
const part2 = lines.slice(654);

const methods = '  // Comments' + '\n' +
  '  async deleteComment(id) {' + '\n' +
  '    const { error } = await this.from(\"comments\").delete().eq(\"id\", id);' + '\n' +
  '    return !error;' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  // Newsletter' + '\n' +
  '  async getNewsletterSubscribers(options) {' + '\n' +
  '    let builder = this.from(\"newsletter_subscribers\").select(\"*\");' + '\n' +
  '    if (options?.status) builder = builder.eq(\"status\", options.status);' + '\n' +
  '    builder = builder.order(\"created_at\", { ascending: false });' + '\n' +
  '    if (options?.limit) builder = builder.limit(options.limit);' + '\n' +
  '    if (options?.offset) builder = builder.range(options.offset, options.offset + (options.limit || 20) - 1);' + '\n' +
  '    const { data } = await builder;' + '\n' +
  '    return this.mapRows(data || []);' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  async deleteSubscriber(id) {' + '\n' +
  '    const { error } = await this.from(\"newsletter_subscribers\").delete().eq(\"id\", id);' + '\n' +
  '    return !error;' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  async getSubscribersDueForDrip() {' + '\n' +
  '    const { data } = await this.from(\"newsletter_subscribers\").select(\"*\").eq(\"status\", \"active\");' + '\n' +
  '    return this.mapRows(data || []);' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  async updateSubscriberDripProgress(id, progress) {' + '\n' +
  '    const { data } = await this.from(\"newsletter_subscribers\").update({ drip_progress: progress }).eq(\"id\", id).select().single();' + '\n' +
  '    return data;' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  // Messages' + '\n' +
  '  async getMessages(options) {' + '\n' +
  '    let builder = this.from(\"messages\").select(\"*\");' + '\n' +
  '    if (options?.status) builder = builder.eq(\"status\", options.status);' + '\n' +
  '    builder = builder.order(\"created_at\", { ascending: false });' + '\n' +
  '    if (options?.limit) builder = builder.limit(options.limit);' + '\n' +
  '    if (options?.offset) builder = builder.range(options.offset, options.offset + (options.limit || 20) - 1);' + '\n' +
  '    const { data } = await builder;' + '\n' +
  '    return this.mapRows(data || []);' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  async markMessageRead(id) {' + '\n' +
  '    const { data } = await this.from(\"messages\").update({ status: \"read\" }).eq(\"id\", id).select().single();' + '\n' +
  '    return data;' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  // Media' + '\n' +
  '  async getMedia(options) {' + '\n' +
  '    let builder = this.from(\"media\").select(\"*\").order(\"created_at\", { ascending: false });' + '\n' +
  '    if (options?.limit) builder = builder.limit(options.limit);' + '\n' +
  '    if (options?.offset) builder = builder.range(options.offset, options.offset + (options.limit || 20) - 1);' + '\n' +
  '    const { data } = await builder;' + '\n' +
  '    return this.mapRows(data || []);' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  async uploadMedia(data) {' + '\n' +
  '    const { data: created } = await this.from(\"media\").insert({ id: crypto.randomUUID(), ...data }).select().single();' + '\n' +
  '    return created;' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  async deleteMedia(id) {' + '\n' +
  '    const { error } = await this.from(\"media\").delete().eq(\"id\", id);' + '\n' +
  '    return !error;' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  // Users' + '\n' +
  '  async createUser(data) {' + '\n' +
  '    const { data: created } = await this.from(\"users\").insert({ id: crypto.randomUUID(), ...data }).select().single();' + '\n' +
  '    return created;' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  async updateUser(id, updates) {' + '\n' +
  '    const { data } = await this.from(\"users\").update(updates).eq(\"id\", id).select().single();' + '\n' +
  '    return data;' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  // Logs' + '\n' +
  '  async getLogs(options) {' + '\n' +
  '    let builder = this.from(\"activity_logs\").select(\"*\").order(\"created_at\", { ascending: false });' + '\n' +
  '    if (options?.level) builder = builder.eq(\"level\", options.level);' + '\n' +
  '    if (options?.limit) builder = builder.limit(options.limit);' + '\n' +
  '    if (options?.offset) builder = builder.range(options.offset, options.offset + (options.limit || 50) - 1);' + '\n' +
  '    const { data } = await builder;' + '\n' +
  '    return this.mapRows(data || []);' + '\n' +
  '  }' + '\n' +
  '' + '\n' +
  '  // Comments' + '\n' +
  '  async deleteComment(id) {' + '\n' +
  '    const { error } = await this.from(\"comments\").delete().eq(\"id\", id);' + '\n' +
  '    return !error;' + '\n' +
  '  }' + '\n';

const part1 = lines.slice(0, 653);
const part2 = lines.slice(654);

const newLines = part1.concat(methods.split('\n')).concat(['  }']).concat(part2.slice(1));
fs.writeFileSync('server/db/mysql-adapter.ts', newLines.join('\n'));
console.log('Fixed');
