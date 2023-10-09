## About

@reminder_app3_bot is a mini-application that allows you to create reminders for you, so you don’t forget about important dates and events. The user is provided with a convenient interface that supports 4 languages and 9 different types of reminders.

How often have you forgotten about something, how often have you missed some important dates, forgotten to watch some online broadcast of someone’s birthday, called the tax office on Thursday, sent a letter to a friend in the morning? This is a telegram application that will notify you about events that are important to you so that you do not forget about them. Just enter the text for the reminder and some other data, the application will start working. It will be useful for absolutely everyone. The fully functional version of the application is now available here https://t.me/reminder_app3_bot

## Peculiarities

On the backend side, python with the tornado framework plus aiogram is used. The frontend is written in javascript with the jquery library and the tailwindcss css framework. The mysql database is used (although it was possible to get by with regular files).
The application has been translated into several languages, including: English, German, Russian and Korean. Depending on what language is configured on the user’s device, the application will be displayed in the appropriate language; if the language is not found (for example, the user’s language is Chinese), then the application is displayed in English by default.
All commands for the terminal that you will see below according to the instructions will be made for the Debian operating system.

## Minimum requirements

1) Domain with https
2) Operating system: Ubuntu / Debian / Centos
3) RAM: 512 MB or more
4) Cores: 1
5) Python: v3.9
6) MySQL: 5.7
7) MariaDB: 10.4

## Install required dependencies

1) install dependencies for python3

```
apt install python3-setuptools
apt install python3-pip
```

2) install packages (If you have Debian 12, use the --break-system-packages switch at the end of the command, for example "pip3 install tornado --break-system-packages")

```
pip3 install --force-reinstall -v "aiogram==2.25.1"
pip3 install PyMySQL
pip3 install PyMySQL[rsa]
pip3 install python-dotenv
pip3 install tornado
```

## Installing and configuring mysql server

1) Install Mysql (if you already have mysql installed, you can skip this step). Instead of MySQL, we will use its improved and optimized version - MariaDB. It is a very reliable and scalable SQL server with many improvements and enhancements.

```
apt install mariadb-server mariadb-client
```

When the installation is complete, we can proceed to setting up the database, to do this, run the command:

```
mysql_secure_installation
```

First you need to enter the current root password, enter the password and press "enter", then it will ask us whether to switch to unix_socket authentication, enter "y", then it will ask us if we want to change the root password, press "n". Then it will ask whether to disable guest accounts, be sure to put “y”, after which it will ask whether to disable remote access to the database via root, write “y”, then it will ask whether to delete the ban test database, put “y”, then it will ask whether to restart the privilege table , put "y".

2) Setting up Mysql (if you already have mysql configured, you can skip this step). We need to configure the minimum required configuration.

```
nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

Let's make sure that after the [mysqld] section we have the following options:

```
user                    = mysql
pid-file                = /run/mysqld/mysqld.pid
socket                  = /run/mysqld/mysqld.sock
port                    = 3306
basedir                 = /usr
datadir                 = /var/lib/mysql
tmpdir                  = /tmp
lc-messages-dir         = /usr/share/mysql
skip-name-resolve
bind-address            = 127.0.0.1
```

Next, uncomment the following options and set the necessary values for them:

```
log_error = /var/log/mysql/error.log
slow_query_log_file = /var/log/mysql/mariadb-slow.log
slow_query_log = ON
long_query_time = 2
log_slow_rate_limit = 1000
max_connections = 256
```

In mariadb version 10.11 these options have a different name, i.e.

```
log_slow_query_file    = /var/log/mysql/mariadb-slow.log
log_slow_query_time    = 2
log_slow_query = ON # and this option is completely absent
log_slow_min_examined_row_limit = 1000
```

After the [mariadb] section we insert these options (initially they are not there):

```
innodb_flush_log_at_trx_commit = 2
innodb_file_per_table = ON
innodb_stats_on_metadata = 0
transaction-isolation = REPEATABLE-READ
wait_timeout = 2678400
interactive_timeout = 2678400
```

For more advanced mysql settings, you can refer to other sources on the Internet =)

Be sure to create some user other than root in your operating system; if there is no user on the system yet, then create it as follows: 
```
adduser UserName
```
where UserName is the user name. You will then be asked for a password and a repeat password for this user, then it will ask for some other data but you can skip them by pressing "enter". Then you need to give the new user administrator rights or sudo rights 

```
usermod -aG sudo,www-data UserName
```

where: UserName is the user name.

3) Create a user and password for mysql under which it will work (if you have already created such a user, you can skip this step).

```
mysql -uroot -p<MYPASSWORD>
```

where: <MYPASSWORD> is the root password. The mysql command input panel will then open. The following command creates the user "newuser" with the password "password" for mysql: 

```
CREATE USER 'newuser'@'%' IDENTIFIED BY 'password';
```

where: newuser is UserName (the user of your operating system, not root) and password is the password for UserName. Next, set up access rights: 

```
GRANT ALL PRIVILEGES ON * . * TO 'newuser'@'%';
```

where: newuser is our user for mysql. Next, enter

```
FLUSH PRIVILEGES;
```

to update all access rights.

4) Next, create a database for the application (if you have already created a database with a specific name, you can skip this step)

```
CREATE DATABASE db_name;
```

where: db_name is the name of the database.

Exit "\q" and "enter".

Reboot the mysql server 

```
/etc/init.d/mysql restart
```

if it returns the error "-bash: /etc/init.d/mysql: No such file or directory" then try 

```
service mysql restart
```

and then check 

```
service mysql status
```

## Installation, configuration and use of the reminder_app application

1) Create a directory in which the application will be located, I recommend the /usr/local directory, but you can use any other one.

```
mkdir /usr/local/reminder_app
```

Go inside the directory

```
cd /usr/local/reminder_app
```

Then download all the contents of the archive with the reminder_app application into it.
You should end up with a tree like this (enter "tree" if you have this installed):

```
├── business_logic.py
├── public
│   ├── css
│   │   ├── main_a5ec25957ce9e2902a8c1fd14f3d2983.css
│   ├── fonts
│   │   └── Tahoma.ttf
│   ├── img
│   │   └── logo.jpg
│   │   ├── image_1.jpg
│   │   ├── image_2.png
│   │   ├── image_3.png
│   │   ├── image_4.jpg
│   │   ├── image_5.png
│   │   ├── image_6.png
│   ├── index.html
│   ├── js
│   │   ├── jquery-3.6.0.min.js
│   │   ├── main_6277e2a7446059985dc9bcf0a4ac1a8f.js
│   │   └── tailwindcss-3.0.0.min.js
│   └── lang
│       ├── de.json
│       ├── ko.json
│       ├── ru.json
│       └── us.json
├── __pycache__
│   └── business_logic.cpython-39.pyc
├── reminder_app.py
└── reminder_app.service
```

2) Configuration of the reminder_app application.

```
nano .env
```

and set the options to the required values:

<b>TELEGRAM_TOKEN</b> - a token from your telegram bot that is built into the reminder_app application, obtained using a special bot https://t.me/BotFather

<b>ADMIN_ID</b> - admin id, since each telegram user has his own unique numeric id. You can leave it empty, but then the administrator in Telegram will not receive messages about errors in the operation of the reminder_app application, in which case it will be necessary to manually check the file with errors “other_errors.log”

<b>HTTP_SERVER_PORT</b> - the port on which the http server of the reminder_app application will work, by default it is port 80, but if you already have some services on this port, for example nginx, then you can change this port to another. Please note that if you change the port to another, you will need to make additional settings for your domain on which the reminder_app application will be available, for example, you changed the port to 8088, then your application should be available at https://site.com: 8088/ I recommend not changing this port.

<b>URL_WEBAPP</b> - the address of your reminder_app, for example https://site.com/reminder_app or https://site.com/ha-ha-ha or even https://site.com/f42d0d0745785ffd61d905f038ce762f. I recommend putting some random line at the end, because the Internet is constantly being scanned by different bots in search of something they can profit from, and they can easily stumble upon your application if it has a simple address such as https://site. com/ so put something unusual at the end, for example https://site.com/238468234_9723_973_4239812___HKJHVdiuiuuuuuuu. Thus, such a complex address with a 99.999% guarantee will not be found by bots that constantly scan the Internet.

<b>USERS_TABLE_NAME</b> - name of the mysql table with users. By default this is "users" but since this is a fairly common name for tables with users, it may be taken by you for some other tasks, you can set a different name, for example "users_reminder_app"

<b>DB_HOST</b> is the host for mysql, most likely it is 127.0.0.1 or localhost. It's better not to touch this value.

<b>DB_PORT</b> is a port for mysql, it’s also better not to touch it.

<b>DB_DATABASE</b> - name of the database where application user data will be stored. According to the instructions described above, we created a database with you, remember?

<b>DB_USERNAME</b> is the username for the database, this must be the user on your operating system (not root), which must also be saved in mysql. According to the instructions described above, we created a user with you, remember?

<b>DB_PASSWORD</b> - user password in your operating system

3) Test launch of the reminder_app application. Run the command

```
python3 reminder_app.py
```

in the terminal (don't forget that you should be in the directory with the reminder_app application), if there are no errors in the terminal, and you see "[Info] Application launched" wait a few seconds, if there are still no errors then the application is probably running successfully. Press "ctrl + c" to stop the application.

4) Setting up a service for the reminder_app application. The service is required to start, stop or check the status of the reminder_app application from the terminal. Open the file "nano reminder_app.service" pay attention to "python3.9" if the version of python that you have installed matches version 3.9 then good, if it is different then make the appropriate changes to the reminder_app.service file. Next, pay attention to the path to the application, by default it is “/usr/local/reminder_app/reminder_app.py” leave it as it is if you installed the application in the /usr/local/ directory as I recommended, if not, then specify the correct path.

5) Completing all settings of the reminder_app application. Go to the directory

```
cd /etc/systemd/system
```

this is where all sorts of systemd daemons are usually located. Copy the reminder_app.service service file into it with the following command

```
cp /usr/local/reminder_app/reminder_app.service /etc/systemd/system
```

then check whether the service file appears in the /etc/systemd/system directory 

```
ls -la /etc/ systemd/system
```

if it appears, then great. Next, enter the following commands in turn to initialize the new service:

```
systemctl --system daemon-reload
systemctl enable reminder_app
systemctl start reminder_app
```

Then enter 

```
systemctl status reminder_app
```

and see what the terminal displays, if you see "active (running)" in green, then everything is working. If not, look at the error logs in the file other_errors.log

```
nano /usr/local/reminder_app/other_errors.log
```

or enter 

```
journalctl -u reminder_app.service -n 100 -e
```

the last 100 lines with entries about possible reminder_app application errors, to return to the terminal, enter "q" and "enter".

## Usage

You can stop the application from the terminal with the command 

```
service reminder_app stop
```

you can start it with the command

```
service reminder_app start
```

check the status 

```
service reminder_app status
```

If you make any changes to the /usr/local/reminder_app/public/index.html file, then after that you need to restart the service with the command 

```
service reminder_app restart
```

Otherwise, no one will see your changes, since the application caches the index.html file

If you completed all the above procedures without errors, then it’s time to check the reminder_app application in action. Open the telegram bot that you created using a special bot https://t.me/BotFather, then click the bottom button "Start", the bot should respond with a message like "Hello %USER%, click the button below to get started" (or " Hello Administrator %USER%, click the button below to get started") there should be an "open" button under the message, click on it to open the application.

The application logo should appear in front of you for a moment

![image_1](https://github.com/login9000/repository_1/blob/main/img/image_1.jpg?raw=true)

And then

![image_2](https://github.com/login9000/repository_1/blob/main/img/image_2.png?raw=true)

Click on the plus button, a window will open to add a new reminder

![image_3](https://github.com/login9000/repository_1/blob/main/img/image_3.png?raw=true)

Fill in the required fields and click Save.

![image_4](https://github.com/login9000/repository_1/blob/main/img/image_4.jpg?raw=true)

The application works with the following types of reminders:

<b>each hour</b> - this type is suitable for reminders that you need to check your balance on some resource, for example, you have been credited with money but it has not arrived yet, and you can receive a reminder every hour at a certain minute that you need to double-check your balance

<b>every few hours</b> - this type is suitable for reminders that it’s time to take a break from working at the computer, or it’s time to walk the dog (every 4 hours for example)

<b>at a certain hour</b> - this type is suitable for reminders that it’s time to go to bed, if you often stay up late at the computer and want to learn to go to bed earlier, then the application can help you, it will send you a reminder every day at a certain hour and certain minute

<b>every few days</b> - this type is suitable for reminders that you need to visit a doctor or go for procedures, for example every 3 days

<b>at a certain day</b> - this type is suitable for reminders that you need to pick up your salary, for example, your salary comes to you every Friday and you constantly forget to pick it up on that day, the application will remind you of this

<b>on a certain date</b> - this type is suitable for reminders that it is necessary to send a tax report to the bank, the application will send a reminder every month on a certain date at a certain hour and minute

<b>in a certain month</b> - this type is suitable for reminders that your friend has a birthday, or you have an important meeting every year on a certain date

<b>every few months</b> - this type is suitable for reminders that, for example, every 5 months on the 14th at 13:45 you have some important meeting

<b>specific date (once)</b> - this type is suitable for one-time reminders on a specific date, then the reminder is automatically deleted from the database

![image_5](https://github.com/login9000/repository_1/blob/main/img/image_5.png?raw=true)

The reminder_app application is intuitive and easy to use, allows you to create an unlimited number of reminders, as well as edit and delete them

![image_6](https://github.com/login9000/repository_1/blob/main/img/image_6.png?raw=true)


## Developers

[login9000](https://github.com/login9000)

## What are my plans...

I want to make it possible for the application to send reminders to a group or channel, as well as to my contacts


### License

MIT






