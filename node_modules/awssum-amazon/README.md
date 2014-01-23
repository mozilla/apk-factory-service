# Amazon (for AwsSum) #

This is the base class for all Amazon services. It defines a few things such as constants and the constructor expects
certain variables to be passed in, which are common across (most) services.

It also defines two other base classes which include signing for AWS Signature v2 and AWS Signature v4. Your base class
can inherit from these rather than the plain base class.

## Writing an Amazon Service plugin for AwsSum ##

There are many examples of service plugins for Amazon, so please take a look at the following repos:

* https://github.com/awssum/awssum-amazon-s3 (custom signature)
* https://github.com/awssum/awssum-amazon-ec2 (AWS Signature v2)
* https://github.com/awssum/awssum-amazon-ses (custom signature)
* https://github.com/awssum/awssum-amazon-dynamodb (AWS Signature v4)

(Ends)
