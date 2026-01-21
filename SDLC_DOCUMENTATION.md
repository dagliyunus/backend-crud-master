# Software Development Life Cycle (SDLC) Documentation

## Backend CRUD API - PostgreSQL Migration Project

---

## 1. Planning Phase

### 1.1 Project Overview
The Backend CRUD API project is a RESTful web service designed to provide user authentication and post management functionality. The project was migrated from MongoDB to PostgreSQL to leverage relational database capabilities and improve data integrity.

### 1.2 Project Objectives
- **Primary Objective**: Migrate the existing MongoDB-based backend to PostgreSQL
- **Secondary Objectives**:
  - Maintain all existing API functionality
  - Improve data consistency with relational database constraints
  - Simplify database schema and queries
  - Ensure backward compatibility with existing API endpoints

### 1.3 Project Scope
**In Scope:**
- Database migration from MongoDB to PostgreSQL
- User authentication system (register, login, logout)
- Post management system (create, read, update, delete)
- Database schema design and implementation
- API endpoint maintenance

**Out of Scope:**
- Frontend development
- Advanced authentication (JWT tokens, OAuth)
- File upload functionality
- Real-time features
- Caching layer implementation

### 1.4 Resources Required
- **Development Environment**: Node.js runtime
- **Database**: PostgreSQL (local or cloud instance)
- **Tools**: Git, npm, code editor
- **Dependencies**: Express.js, pg, bcrypt, dotenv

### 1.5 Timeline
- **Planning**: 1 day
- **Analysis**: 1 day
- **Design**: 1 day
- **Implementation**: 2-3 days
- **Testing & Integration**: 1-2 days
- **Maintenance Setup**: 1 day

**Total Estimated Duration**: 7-9 days

### 1.6 Risk Assessment
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | High | Low | Backup existing data before migration |
| Performance issues | Medium | Medium | Optimize queries, add indexes |
| API compatibility issues | High | Low | Thorough testing of all endpoints |
| Database connection failures | Medium | Low | Implement connection pooling and retry logic |

---

## 2. Analysis Phase

### 2.1 Requirements Analysis

#### 2.1.1 Functional Requirements

**User Management:**
- FR1: System shall allow users to register with username, email, and password
- FR2: System shall validate user input (username: 1-25 chars, password: 6-50 chars)
- FR3: System shall ensure email and username uniqueness
- FR4: System shall hash passwords using bcrypt before storage
- FR5: System shall allow users to login with email and password
- FR6: System shall verify password during login
- FR7: System shall allow users to logout

**Post Management:**
- FR8: System shall allow creation of posts with name, description, and age
- FR9: System shall validate post data (age: 1-150)
- FR10: System shall retrieve all posts
- FR11: System shall allow updating posts by ID
- FR12: System shall allow deleting posts by ID

#### 2.1.2 Non-Functional Requirements
- **Performance**: API response time < 500ms for 95% of requests
- **Security**: Passwords must be hashed, no plain text storage
- **Scalability**: Support at least 1000 concurrent users
- **Reliability**: 99% uptime
- **Maintainability**: Code should follow modular architecture
- **Compatibility**: Support Node.js 18+ and PostgreSQL 12+

### 2.2 System Analysis

#### 2.2.1 Current System (MongoDB)
- **Database**: MongoDB with Mongoose ODM
- **Data Model**: Document-based (NoSQL)
- **Connection**: Single connection string
- **Schema**: Flexible schema with validation

#### 2.2.2 Target System (PostgreSQL)
- **Database**: PostgreSQL relational database
- **Data Model**: Table-based (SQL)
- **Connection**: Connection pooling with pg library
- **Schema**: Fixed schema with constraints

#### 2.2.3 Migration Analysis
**Data Mapping:**
- MongoDB `_id` → PostgreSQL `id` (SERIAL PRIMARY KEY)
- MongoDB documents → PostgreSQL rows
- MongoDB collections → PostgreSQL tables
- MongoDB timestamps → PostgreSQL TIMESTAMP columns

**Key Differences:**
- PostgreSQL requires explicit schema definition
- PostgreSQL uses SQL queries instead of Mongoose methods
- PostgreSQL enforces referential integrity
- PostgreSQL uses connection pooling

### 2.3 Stakeholder Analysis
- **Primary Users**: Application developers consuming the API
- **Secondary Users**: End users (through frontend applications)
- **Project Team**: Backend developers, database administrators

---

## 3. Design Phase

### 3.1 System Architecture

#### 3.1.1 High-Level Architecture
```
┌─────────────┐
│   Client    │
│ (Frontend)  │
└──────┬──────┘
       │ HTTP/REST
       │
┌──────▼──────────────────┐
│   Express.js Server     │
│  ┌──────────────────┐   │
│  │  Route Handlers  │   │
│  └────────┬─────────┘   │
│           │              │
│  ┌────────▼─────────┐   │
│  │   Controllers    │   │
│  └────────┬─────────┘   │
│           │              │
│  ┌────────▼─────────┐   │
│  │     Models       │   │
│  └────────┬─────────┘   │
└───────────┼──────────────┘
            │
┌───────────▼──────────────┐
│   PostgreSQL Database   │
│  ┌──────────┐ ┌────────┐ │
│  │  users   │ │ posts  │ │
│  └──────────┘ └────────┘ │
└──────────────────────────┘
```

#### 3.1.2 Component Architecture
- **Presentation Layer**: Express.js routes
- **Business Logic Layer**: Controllers
- **Data Access Layer**: Models (PostgreSQL queries)
- **Database Layer**: PostgreSQL with connection pooling

### 3.2 Database Design

#### 3.2.1 Entity Relationship Diagram
```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │
│ username     │
│ email (UK)   │
│ password     │
│ logged_in    │
│ created_at   │
│ updated_at   │
└──────────────┘

┌──────────────┐
│    posts     │
├──────────────┤
│ id (PK)      │
│ name         │
│ description  │
│ age          │
│ created_at   │
│ updated_at   │
└──────────────┘
```

#### 3.2.2 Database Schema Design

**Users Table:**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(25) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    logged_in BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Posts Table:**
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 1 AND age <= 150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_users_email` on `users(email)` - For fast email lookups
- `idx_users_username` on `users(username)` - For fast username lookups

#### 3.2.3 Data Constraints
- **Primary Keys**: `id` in both tables (auto-increment)
- **Unique Constraints**: `username` and `email` in users table
- **Check Constraints**: `age` must be between 1 and 150
- **NOT NULL Constraints**: All required fields
- **Default Values**: `logged_in = false`, timestamps auto-set

### 3.3 API Design

#### 3.3.1 API Endpoints

**User Endpoints:**
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout

**Post Endpoints:**
- `POST /api/v1/posts/create` - Create new post
- `GET /api/v1/posts/getPosts` - Get all posts
- `PATCH /api/v1/posts/update/:id` - Update post by ID
- `DELETE /api/v1/posts/delete/:id` - Delete post by ID

#### 3.3.2 Request/Response Formats

**Register Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Register Response:**
```json
{
  "message": "User registered",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "username": "john_doe"
  }
}
```

**Create Post Request:**
```json
{
  "name": "John Doe",
  "description": "Software Developer",
  "age": 28
}
```

### 3.4 Security Design
- **Password Hashing**: bcrypt with salt rounds = 10
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **Error Handling**: Generic error messages to prevent information leakage

### 3.5 File Structure Design
```
backend-crud-master/
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL connection
│   │   └── schema.sql       # Database schema
│   ├── controllers/
│   │   ├── user.controller.js
│   │   └── post.controller.js
│   ├── models/
│   │   ├── user.model.js
│   │   └── post.model.js
│   ├── routes/
│   │   ├── user.route.js
│   │   └── post.route.js
│   ├── app.js               # Express app setup
│   └── index.js             # Server entry point
├── .env                     # Environment variables
├── package.json
└── README.md
```

---

## 4. Implementation Phase

### 4.1 Technology Stack

#### 4.1.1 Core Technologies
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v5.2.1
- **Database**: PostgreSQL
- **Database Client**: pg (node-postgres) v8.11.3
- **Password Hashing**: bcrypt v6.0.0
- **Environment Management**: dotenv v17.2.3

#### 4.1.2 Development Tools
- **Package Manager**: npm
- **Development Server**: nodemon (for auto-reload)

### 4.2 Implementation Steps

#### Step 4.2.1: Database Setup
1. **Install PostgreSQL dependencies**
   ```bash
   npm install pg
   ```

2. **Create database schema file** (`src/config/schema.sql`)
   - Define users table structure
   - Define posts table structure
   - Create indexes for performance

3. **Configure database connection** (`src/config/database.js`)
   - Set up PostgreSQL connection pool
   - Implement connection initialization
   - Auto-execute schema on first connection

#### Step 4.2.2: Model Implementation

**User Model** (`src/models/user.model.js`):
- Implement `create()` method with validation and password hashing
- Implement `findOne()` method for user lookup
- Implement `comparePassword()` static method for authentication

**Post Model** (`src/models/post.model.js`):
- Implement `create()` method with validation
- Implement `find()` method to retrieve all posts
- Implement `findById()` method for single post retrieval
- Implement `findByIdAndUpdate()` method for updates
- Implement `findByIdAndDelete()` method for deletion

#### Step 4.2.3: Controller Updates

**User Controller** (`src/controllers/user.controller.js`):
- Update `registerUser()` to use PostgreSQL model
- Update `loginUser()` to use PostgreSQL model and password comparison
- Update `logoutUser()` to use PostgreSQL model
- Change `_id` references to `id` (PostgreSQL uses `id`)

**Post Controller** (`src/controllers/post.controller.js`):
- Update all CRUD operations to use PostgreSQL model
- Remove MongoDB-specific options (e.g., `{new: true}`)

#### Step 4.2.4: Environment Configuration
- Update `.env` file structure:
  ```
  DATABASE_URL=postgresql://username:password@localhost:5432/database_name
  PORT=8000
  ```

#### Step 4.2.5: Package Configuration
- Update `package.json`:
  - Remove `mongoose` dependency
  - Add `pg` dependency
  - Keep other dependencies unchanged

### 4.3 Code Implementation Details

#### 4.3.1 Database Connection Pattern
```javascript
// Connection pooling for better performance
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Auto-initialize schema on connection
await pool.query(schema);
```

#### 4.3.2 Query Pattern
- Use parameterized queries to prevent SQL injection
- Use `RETURNING *` clause for INSERT/UPDATE operations
- Implement proper error handling

#### 4.3.3 Password Security
- Hash passwords before storage using bcrypt
- Compare passwords using bcrypt.compare()
- Never store plain text passwords

### 4.4 Migration Checklist
- [x] Create PostgreSQL schema
- [x] Update database connection
- [x] Refactor user model
- [x] Refactor post model
- [x] Update user controller
- [x] Update post controller
- [x] Update package.json
- [x] Update README.md
- [x] Test all endpoints

---

## 5. Testing & Integration Phase

### 5.1 Testing Strategy

#### 5.1.1 Unit Testing
**User Model Tests:**
- Test user creation with valid data
- Test user creation with invalid data
- Test user lookup by email
- Test user lookup by username
- Test password hashing
- Test password comparison

**Post Model Tests:**
- Test post creation
- Test post retrieval
- Test post update
- Test post deletion
- Test validation constraints

#### 5.1.2 Integration Testing
**API Endpoint Tests:**
- Test user registration endpoint
- Test user login endpoint
- Test user logout endpoint
- Test post creation endpoint
- Test post retrieval endpoint
- Test post update endpoint
- Test post deletion endpoint

**Database Integration Tests:**
- Test database connection
- Test schema initialization
- Test transaction handling
- Test connection pooling

#### 5.1.3 Test Cases

**User Registration:**
| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Valid registration | Valid username, email, password | 201 Created, user object returned |
| Duplicate email | Existing email | 400 Bad Request, error message |
| Missing fields | Incomplete data | 400 Bad Request, validation error |
| Invalid password length | Password < 6 chars | 400 Bad Request, validation error |

**User Login:**
| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Valid credentials | Correct email and password | 200 OK, user object returned |
| Invalid email | Non-existent email | 400 Bad Request, "User not found" |
| Invalid password | Wrong password | 400 Bad Request, "Invalid credentials" |

**Post Management:**
| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Create valid post | Valid name, description, age | 201 Created, post object returned |
| Invalid age | Age < 1 or > 150 | 400 Bad Request, validation error |
| Update post | Valid ID and update data | 200 OK, updated post returned |
| Delete post | Valid ID | 200 OK, success message |

### 5.2 Integration Steps

#### Step 5.2.1: Database Integration
1. **Setup PostgreSQL instance**
   - Install PostgreSQL locally or use cloud service
   - Create database
   - Configure connection string

2. **Initialize schema**
   - Run schema.sql or let application auto-initialize
   - Verify tables and indexes created

3. **Test connection**
   - Verify connection pooling works
   - Test query execution

#### Step 5.2.2: API Integration
1. **Start server**
   ```bash
   npm start
   ```

2. **Test endpoints using Postman/curl**
   - Test all user endpoints
   - Test all post endpoints
   - Verify response formats

3. **Verify data persistence**
   - Create data and verify it's stored
   - Update data and verify changes
   - Delete data and verify removal

### 5.3 Performance Testing
- **Load Testing**: Test with 100+ concurrent requests
- **Response Time**: Measure average response time
- **Database Performance**: Monitor query execution time
- **Connection Pooling**: Verify pool handles multiple connections

### 5.4 Security Testing
- **SQL Injection**: Test with malicious SQL inputs
- **Input Validation**: Test with invalid inputs
- **Password Security**: Verify passwords are hashed
- **Error Handling**: Verify no sensitive data in error messages

### 5.5 Deployment Checklist
- [ ] Database backup created
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Database schema initialized
- [ ] All endpoints tested
- [ ] Error handling verified
- [ ] Logging configured
- [ ] Documentation updated

---

## 6. Maintenance Phase

### 6.1 Maintenance Strategy

#### 6.1.1 Preventive Maintenance
- **Regular Updates**: Keep dependencies up to date
- **Database Maintenance**: Regular VACUUM and ANALYZE operations
- **Monitoring**: Set up application and database monitoring
- **Backup Strategy**: Regular database backups

#### 6.1.2 Corrective Maintenance
- **Bug Fixes**: Address reported issues promptly
- **Error Handling**: Improve error handling based on logs
- **Performance Optimization**: Optimize slow queries

#### 6.1.3 Adaptive Maintenance
- **Feature Additions**: Add new features as requirements change
- **Scalability Improvements**: Optimize for increased load
- **Technology Updates**: Migrate to newer versions when stable

### 6.2 Monitoring & Logging

#### 6.2.1 Application Monitoring
- **Server Health**: Monitor server uptime and response times
- **Error Tracking**: Log and track application errors
- **API Usage**: Monitor endpoint usage and performance
- **Database Connections**: Monitor connection pool usage

#### 6.2.2 Database Monitoring
- **Query Performance**: Monitor slow queries
- **Connection Pool**: Monitor active connections
- **Database Size**: Monitor database growth
- **Index Usage**: Verify indexes are being used

#### 6.2.3 Logging Strategy
```javascript
// Log levels to implement:
- ERROR: Critical errors requiring immediate attention
- WARN: Warning conditions
- INFO: General informational messages
- DEBUG: Detailed debugging information
```

### 6.3 Backup & Recovery

#### 6.3.1 Backup Strategy
- **Frequency**: Daily automated backups
- **Retention**: Keep backups for 30 days
- **Location**: Store backups in secure, separate location
- **Testing**: Regularly test backup restoration

#### 6.3.2 Recovery Procedures
1. **Database Recovery**
   ```bash
   # Restore from backup
   pg_restore -d database_name backup_file.dump
   ```

2. **Application Recovery**
   - Redeploy application from version control
   - Restore environment variables
   - Verify database connection

### 6.4 Documentation Maintenance
- **API Documentation**: Keep API docs updated with changes
- **Code Comments**: Maintain inline code documentation
- **README**: Update README with new features/changes
- **Change Log**: Maintain version history and changes

### 6.5 Support & Troubleshooting

#### 6.5.1 Common Issues

**Database Connection Issues:**
- **Symptom**: "PostgreSQL connection failed"
- **Solution**: Check connection string, verify PostgreSQL is running, check firewall

**Query Performance Issues:**
- **Symptom**: Slow API responses
- **Solution**: Check query execution plans, add indexes, optimize queries

**Password Hashing Issues:**
- **Symptom**: Login failures
- **Solution**: Verify bcrypt version compatibility, check password comparison logic

#### 6.5.2 Support Procedures
1. **Issue Reporting**: Users report issues through designated channel
2. **Issue Triage**: Prioritize issues by severity
3. **Resolution**: Fix and test solution
4. **Deployment**: Deploy fix to production
5. **Verification**: Verify fix resolves issue

### 6.6 Future Enhancements

#### 6.6.1 Planned Improvements
- **Authentication**: Implement JWT token-based authentication
- **Validation**: Add input validation middleware (e.g., Joi, express-validator)
- **Testing**: Add automated test suite (Jest, Mocha)
- **API Documentation**: Add Swagger/OpenAPI documentation
- **Caching**: Implement Redis caching for frequently accessed data
- **Rate Limiting**: Add rate limiting to prevent abuse

#### 6.6.2 Scalability Considerations
- **Horizontal Scaling**: Design for multiple server instances
- **Database Replication**: Consider read replicas for scaling
- **Load Balancing**: Implement load balancer for multiple instances
- **Microservices**: Consider breaking into microservices if needed

### 6.7 Maintenance Schedule

| Task | Frequency | Responsible |
|------|-----------|-------------|
| Dependency updates | Monthly | Development Team |
| Database backups | Daily | DevOps Team |
| Performance review | Quarterly | Development Team |
| Security audit | Quarterly | Security Team |
| Documentation update | As needed | Development Team |
| Database optimization | Monthly | Database Admin |

---

## Conclusion

This SDLC documentation provides a comprehensive overview of the Backend CRUD API project migration from MongoDB to PostgreSQL. The document covers all phases from initial planning through ongoing maintenance, ensuring a structured approach to software development and deployment.

The migration successfully maintains all existing functionality while providing the benefits of a relational database system, including data integrity, ACID compliance, and structured query capabilities.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Project Status**: Completed
