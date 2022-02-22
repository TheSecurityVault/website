---
title: What is and how to prevent Mass Assignment Vulnerabilities
description: With mass assignment vulnerabilities an attacker can manipulate data he doesn't have access to, sometimes to bypass permissions/validations
date: '2021-06-13'
category: appsec
preview: images/banner.jpeg
keywords:
  - assignment
  - injection
  - javascript
  - mass
  - mongo
  - nosql
  - rails
  - spring
  - strong
aliases:
  - appsec/what-is-and-how-to prevent-mass-assignment
  - appsec/asd
type: post
lastmod: '2022-02-20T13:42:27.322Z'
---

First time I heard about mass assignment vulnerabilities was a long time ago, when I started learning Ruby & Rails. In fact I learnt a lot, security related back then, as Rails is a quite complex and secure framework, and to properly work with it you should understand the underlying mechanisms.

At that time Rails had just introduced a security feature called "Strong Parameters" to help protect against mass assignment attacks and I was curious about what it was for so I spent some time going through the docs.

## Mass Assignment Vulnerabilities Explained

The concept referes to when you inject a set of values directly into an object, thus the name mass assignment, which without proper validation can cause serious problems to the application logic.

Lets see a Java example with Spring:

```java
@RequestMapping(value = "/users", method = RequestMethod.POST)
public void create(User user) {
   userService.add(user);
}
```

What can go wrong with the snippet above? If the User object has fields like "isAdmin" an attacker can easily create an admin user because the endpoint blindly accepts all fields from the User class.

### A more complex example

Mass assignment is basically this, but you can have some complex and interesting attack vectors, so lets see another case, this time in Node:

```ts
...
  app.post("/posts", async (req: Request, res: Response) => {
    const p: Post = req.body;
    const post = await Post.create(p).save();
    res.send(post);
  });
...

@Entity("posts")
export class Post extends BaseEntity {
  ...
  @ManyToOne(type => Author, author => author.posts, { cascade: true })
  @JoinColumn({ name: "author_id" })
  author?: Author;
}

@Entity("authors")
export class Author extends BaseEntity {
  ...
  @Column({ name: "is_admin" }) isAdmin?: number;

  @OneToMany(type => Post, post => post.author)
  posts?: Post[];
}
```

This example uses Express and TypeORM with the ActiveRecord pattern.

The endpoint receives a "Post" object in the request's body and blindly creates a post in the database with the data received.

In this case, an attacker can send in the payload a user object, as its part of the Post structure, and this user will get created at the same time than the post. Again, you have the isAdmin field that can be used to create a privileged account, but this time from a Post. Neat.

This is the request content that can trigger this flow:

```json
{"title": "Some Post", "author": {"name": "Me", "isAdmin": true, ...}, ...}
```

### Careful with NoSQL Databases

You can also have Mass Assignment vulnerabilities with NoSQL databases that can cause NoSQL Injection  
Let's take into consideration MongoDB. MongoDB works with unstructured documents, so 10 user objects can have completely different fields in the database and an attacker can take advantage of this

But most important: NoSQL Injection attacks. Mongo query language (MQL) resembles javascript objects so if you use user input to do a query a lot of things can go wrong.

Imagine you have a line like:

```ts
app.post("/search", async (req: Request, res: Response) => {
    const users = await User.find(req.body.name)
    res.send(users);
  });
```

And this is how an attacker could exploit this:

```json
{"name": {"$ne": "-"}}
```

Notice that instead of a string, an object was sent, that will be injected in the find query, searching for all users where name is not equal to "-".

## Prevention

Now that we have a fair understanding of what's Mass Assignment lets move to how to prevent/fix it.

The first tip for that, and should be a rule of thumb for every project is: Know the technologies you're using. This is actually really important, not only for Mass Assignment but for everything... In the second example above, the attack to create a new user was only possible because the cascade property (in the many to one reference) was set to true, otherwise TypeORM wouldn't do it by default. Mass Assignment would still be possible for the Post object.

Another example: Rails implements "Strong Parameters" so if you want to mass assign something you need to explicitly whitelist the parameters that you want to allow for Mass Assignment, but thats for models that inherit from ActiveRecord, so this isn't a "global" protection although it should work for most of cases.

Knowing the frameworks/libs you're working with can help a lot. I usually start by spending some good time reading security and/or best practices from the official docs of the technologies I'm using.

### Data Transfer Objects

Also known as DTOs, the idea behind this approach is that you create objects specifically to be in transit, and most important, with user supplied data. So you only have the fields needed for the required operations.

To fix the first snippet you could create a CreateUserDTO class that didn't have the isAdmin field. Then there's a routine that converts that into a User object (being the default isAdmin option false). You can create other DTOs for sending users that have the isAdmin field if needed.

This is a common practice, but personally I don't like it as adds a lot of overhead, multiple DTOs, the conversions, etc. Personally I like to have simple code so this is not a best fit for me.

### Filter Fields

This is usually my go to. Specify which fields can be sent (whitelisting, never blacklisting), and change them for specific operations if needed. Again, this is the logic of Rails' strong parameters. If you're using an ORM also remember to check the type of a field, because if you get an object where you were expecting a string, the ORM may resolve that and save the foreign object as well. I've seen a lot of "fixes" online to use for example [underscore](https://underscorejs.org/)'s pick method, but if you allow a user field, and the user field is an object, you still have a problem there. So be careful on how you implement this.

You can easily create a method to filter the fields that you want to accept, like this:

```ts
export const filter = (object: any, fields: any) => {
  const cleanObject: any = {}

  Object.keys(fields).forEach(k => {
    const fieldType = fields[k]
    if (typeof fieldType === "object")
      cleanObject[k] = filter(object[k], fieldType)
    else if (typeof object[k] === fieldType)
      cleanObject[k] = object[k]
  })

  return cleanObject
}

const userSuppliedObject = {
  group: {
    name: "My Group",
    public: true,
    owner: {
      username: "NEW USER",
      isAdmin: true
    }
  }
}

const allowedFields = { group: { name: "string", owner: { username: "string" } } };
const cleanObject = filter(userSuppliedObject, allowedFields)
```
